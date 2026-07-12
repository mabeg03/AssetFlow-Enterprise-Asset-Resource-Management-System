-- ============================================================
-- AssetFlow: DB-level status sync triggers & overdue helpers
-- Run this in the Supabase SQL editor.
-- Safe to re-run (uses CREATE OR REPLACE + DROP TRIGGER IF EXISTS).
-- ============================================================

-- ------------------------------------------------------------
-- 1. MAINTENANCE STATUS -> ASSET STATUS SYNC
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_asset_status_from_maintenance()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.assets
         SET status = 'under_maintenance', updated_at = now()
       WHERE id = NEW.asset_id;
    ELSIF NEW.status = 'resolved' THEN
      UPDATE public.assets
         SET status = 'available', updated_at = now()
       WHERE id = NEW.asset_id;
      NEW.resolved_at := COALESCE(NEW.resolved_at, now());
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_asset_status_from_maintenance ON public.maintenance_requests;
CREATE TRIGGER trg_sync_asset_status_from_maintenance
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW EXECUTE FUNCTION public.sync_asset_status_from_maintenance();


-- ------------------------------------------------------------
-- 2. ALLOCATION STATUS -> ASSET STATUS SYNC
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_asset_status_from_allocation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.status = 'active' THEN
      UPDATE public.assets
         SET status = 'allocated', updated_at = now()
       WHERE id = NEW.asset_id;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF NEW.status IS DISTINCT FROM OLD.status OR NEW.actual_return_date IS DISTINCT FROM OLD.actual_return_date THEN
    IF NEW.status = 'returned' OR NEW.actual_return_date IS NOT NULL THEN
      UPDATE public.assets
         SET status = 'available', updated_at = now()
       WHERE id = NEW.asset_id;
      IF NEW.status <> 'returned' THEN
        NEW.status := 'returned';
      END IF;
    ELSIF NEW.status = 'active' THEN
      UPDATE public.assets
         SET status = 'allocated', updated_at = now()
       WHERE id = NEW.asset_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_asset_status_from_allocation_ins ON public.allocations;
CREATE TRIGGER trg_sync_asset_status_from_allocation_ins
AFTER INSERT ON public.allocations
FOR EACH ROW EXECUTE FUNCTION public.sync_asset_status_from_allocation();

DROP TRIGGER IF EXISTS trg_sync_asset_status_from_allocation_upd ON public.allocations;
CREATE TRIGGER trg_sync_asset_status_from_allocation_upd
BEFORE UPDATE ON public.allocations
FOR EACH ROW EXECUTE FUNCTION public.sync_asset_status_from_allocation();


-- ------------------------------------------------------------
-- 3. BOOKING STATUS -> transition helper + view
--    (no scheduled job; call refresh_booking_statuses() from a cron
--     job or a periodic edge function, and rely on the view for reads.)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_booking_statuses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.bookings
     SET status = 'ongoing'
   WHERE status = 'upcoming' AND start_time <= now() AND end_time > now();

  UPDATE public.bookings
     SET status = 'completed'
   WHERE status IN ('upcoming', 'ongoing') AND end_time <= now();
END;
$$;

-- Read-side view: computed live status regardless of stored value
CREATE OR REPLACE VIEW public.bookings_live AS
SELECT b.*,
       CASE
         WHEN b.status = 'cancelled' THEN 'cancelled'
         WHEN b.end_time <= now() THEN 'completed'
         WHEN b.start_time <= now() AND b.end_time > now() THEN 'ongoing'
         ELSE 'upcoming'
       END AS live_status
  FROM public.bookings b;


-- ------------------------------------------------------------
-- 4. OVERDUE DETECTION
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_overdue_allocations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  WITH upd AS (
    UPDATE public.allocations
       SET status = 'overdue'
     WHERE status = 'active'
       AND actual_return_date IS NULL
       AND expected_return_date IS NOT NULL
       AND expected_return_date < CURRENT_DATE
     RETURNING 1
  )
  SELECT count(*) INTO n FROM upd;
  RETURN n;
END;
$$;

CREATE OR REPLACE VIEW public.allocations_live AS
SELECT a.*,
       CASE
         WHEN a.actual_return_date IS NOT NULL THEN 'returned'
         WHEN a.expected_return_date IS NOT NULL
              AND a.expected_return_date < CURRENT_DATE THEN 'overdue'
         ELSE 'active'
       END AS live_status
  FROM public.allocations a;


-- ------------------------------------------------------------
-- 5. AUDIT CYCLE CLOSE -> mark missing assets as 'lost'
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.on_audit_cycle_close()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'closed' AND OLD.status IS DISTINCT FROM 'closed' THEN
    UPDATE public.assets a
       SET status = 'lost', updated_at = now()
      FROM public.audit_items ai
     WHERE ai.audit_cycle_id = NEW.id
       AND ai.result = 'missing'
       AND ai.asset_id = a.id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_audit_cycle_close ON public.audit_cycles;
CREATE TRIGGER trg_on_audit_cycle_close
AFTER UPDATE ON public.audit_cycles
FOR EACH ROW EXECUTE FUNCTION public.on_audit_cycle_close();


-- ------------------------------------------------------------
-- Optional: schedule with pg_cron (uncomment if pg_cron enabled)
-- ------------------------------------------------------------
-- SELECT cron.schedule('assetflow-refresh-bookings', '*/5 * * * *',
--   $$SELECT public.refresh_booking_statuses();$$);
-- SELECT cron.schedule('assetflow-mark-overdue', '0 * * * *',
--   $$SELECT public.mark_overdue_allocations();$$);
