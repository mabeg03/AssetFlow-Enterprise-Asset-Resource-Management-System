
-- Roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'asset_manager', 'department_head', 'employee');

-- Departments
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Employees (profile table)
CREATE TABLE public.employees (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.employees TO authenticated;
GRANT ALL ON public.employees TO service_role;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Roles (separate table for security)
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS public.app_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'asset_manager' THEN 2
    WHEN 'department_head' THEN 3
    WHEN 'employee' THEN 4
  END LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_department(_user_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT department_id FROM public.employees WHERE id = _user_id
$$;

-- Trigger: on signup create employee row + assign role (first user = admin)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  is_first boolean;
  assigned_role public.app_role;
BEGIN
  SELECT NOT EXISTS (SELECT 1 FROM public.employees) INTO is_first;
  assigned_role := CASE WHEN is_first THEN 'admin'::public.app_role ELSE 'employee'::public.app_role END;

  INSERT INTO public.employees (id, name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email
  );

  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, assigned_role);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Employees policies
CREATE POLICY "employees read all authenticated" ON public.employees FOR SELECT TO authenticated USING (true);
CREATE POLICY "employees update self" ON public.employees FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin manage employees" ON public.employees FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Departments policies
CREATE POLICY "departments read all" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- user_roles policies
CREATE POLICY "roles read self" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "roles read admin" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Categories
CREATE TABLE public.asset_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.asset_categories TO authenticated;
GRANT ALL ON public.asset_categories TO service_role;
ALTER TABLE public.asset_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories read all" ON public.asset_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin/manager manage categories" ON public.asset_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'asset_manager'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'asset_manager'));

-- Assets
CREATE TYPE public.asset_status AS ENUM ('available', 'allocated', 'under_maintenance', 'retired', 'lost');
CREATE TABLE public.assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES public.asset_categories(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  status public.asset_status NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT ALL ON public.assets TO service_role;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "assets read admin/manager" ON public.assets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));
CREATE POLICY "assets read dept head" ON public.assets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'department_head') AND department_id = public.get_user_department(auth.uid()));
CREATE POLICY "assets read own" ON public.assets FOR SELECT TO authenticated USING (assigned_to = auth.uid());
CREATE POLICY "assets manage admin/manager" ON public.assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));

-- Allocations
CREATE TABLE public.allocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  allocated_at timestamptz NOT NULL DEFAULT now(),
  expected_return date,
  actual_return_date date,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.allocations TO authenticated;
GRANT ALL ON public.allocations TO service_role;
ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alloc read own" ON public.allocations FOR SELECT TO authenticated USING (employee_id = auth.uid());
CREATE POLICY "alloc read admin/manager" ON public.allocations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));
CREATE POLICY "alloc read dept" ON public.allocations FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'department_head') AND EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = employee_id AND e.department_id = public.get_user_department(auth.uid())
  ));
CREATE POLICY "alloc manage admin/manager" ON public.allocations FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));

-- Bookings
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource text NOT NULL,
  asset_id uuid REFERENCES public.assets(id) ON DELETE SET NULL,
  booked_by uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'upcoming',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read own" ON public.bookings FOR SELECT TO authenticated USING (booked_by = auth.uid());
CREATE POLICY "bookings read admin/manager" ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));
CREATE POLICY "bookings read dept" ON public.bookings FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'department_head') AND EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = booked_by AND e.department_id = public.get_user_department(auth.uid())
  ));
CREATE POLICY "bookings insert own" ON public.bookings FOR INSERT TO authenticated WITH CHECK (booked_by = auth.uid());
CREATE POLICY "bookings update own" ON public.bookings FOR UPDATE TO authenticated USING (booked_by = auth.uid());
CREATE POLICY "bookings manage admin/manager" ON public.bookings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));

-- Maintenance requests
CREATE TABLE public.maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  raised_by uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_requests TO authenticated;
GRANT ALL ON public.maintenance_requests TO service_role;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mr read own" ON public.maintenance_requests FOR SELECT TO authenticated USING (raised_by = auth.uid());
CREATE POLICY "mr read admin/manager" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));
CREATE POLICY "mr read dept" ON public.maintenance_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'department_head') AND EXISTS (
    SELECT 1 FROM public.employees e WHERE e.id = raised_by AND e.department_id = public.get_user_department(auth.uid())
  ));
CREATE POLICY "mr insert own" ON public.maintenance_requests FOR INSERT TO authenticated WITH CHECK (raised_by = auth.uid());
CREATE POLICY "mr manage admin/manager" ON public.maintenance_requests FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));

-- Audit cycles + items
CREATE TABLE public.audit_cycles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_by uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_cycles TO authenticated;
GRANT ALL ON public.audit_cycles TO service_role;
ALTER TABLE public.audit_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit read admin/manager" ON public.audit_cycles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));
CREATE POLICY "audit manage admin/manager" ON public.audit_cycles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));

CREATE TABLE public.audit_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid NOT NULL REFERENCES public.audit_cycles(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  result text NOT NULL DEFAULT 'pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_items TO authenticated;
GRANT ALL ON public.audit_items TO service_role;
ALTER TABLE public.audit_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit items read admin/manager" ON public.audit_items FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));
CREATE POLICY "audit items manage admin/manager" ON public.audit_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));

-- Notifications
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif read own" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notif update own" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- Activity logs
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activity read admin/manager" ON public.activity_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'asset_manager'));
CREATE POLICY "activity read own" ON public.activity_logs FOR SELECT TO authenticated USING (actor_id = auth.uid());
CREATE POLICY "activity insert self" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());
