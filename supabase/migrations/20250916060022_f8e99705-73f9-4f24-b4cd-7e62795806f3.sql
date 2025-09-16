-- Create customers table for CARF system
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_for TEXT NOT NULL,
  bos_mws_code TEXT,
  sold_to_party TEXT NOT NULL,
  ship_to_party TEXT,
  business_center TEXT,
  terms TEXT,
  credit_limit NUMERIC(15,2),
  distributor_type TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVATION',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customer access
CREATE POLICY "Users can view all customers" 
ON public.customers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update customers they created" 
ON public.customers 
FOR UPDATE 
USING (auth.uid() = created_by OR 
       EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete customers" 
ON public.customers 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample data matching the image
INSERT INTO public.customers (request_for, bos_mws_code, sold_to_party, ship_to_party, business_center, terms, credit_limit, distributor_type) VALUES
('ACTIVATION', '', 'NABUNTURAN CENTRAL WAREHOUSE CLUB', 'NABUNTURAN CENTRAL WAREHOUSE CLUB', 'BUTUAN', 'Z15C', 300000, 'MODE'),
('ACTIVATION', '', 'DAVAO CENTRAL WAREHOUSE CLUB, INC.', 'DAVAO CENTRAL WAREHOUSE CLUB,INC', 'BUTUAN', 'Z15C', 300000, 'MODE'),
('ACTIVATION', '', 'AGUANTA, ERNESTO JR. AMANTE', 'AGUANTA, ERNESTO JR. AMANTE - VAN SALES', 'DAVAO', 'COD', 1000, 'VAN S'),
('ACTIVATION', '', 'GUMANTASON, MARLON MENDOZA', 'GUMANTASON, MARLON MENDOZA - VAN SALES', 'DAVAO', 'COD', 1000, 'VAN S'),
('ACTIVATION', '', 'CRUZ, ETHEL MAY GRACE ABABA', 'CRUZ, ETHEL MAY GRACE ABABA - VAN SALES', 'DAVAO', 'COD', 1000, 'VAN S'),
('ACTIVATION', '', 'BEDOLIDO, REY CAREZON', 'BEDOLIDO, REY CAREZON - VAN SALES', 'DAVAO', 'COD', 1000, 'VAN S'),
('ACTIVATION', '', 'TIEMPO, MELROSE MANSUGAN', 'TIEMPO, MELROSE MANSUGAN - VAN SALES', 'DAVAO', 'COD', 1000, 'VAN S'),
('ACTIVATION', '', 'TIEMPO, MELROSE MANSUGAN', 'TIEMPO, MELROSE MANSUGAN - LIVE SALES', 'DAVAO', 'COD', 1000, 'LIVE S'),
('ACTIVATION', '', 'SANFORD MARKETING CORPORATION', 'SANFORD MARKETING CORPORATION- SMC BULAN', 'BICOL', 'Z15', 500000, 'MODE'),
('ACTIVATION', '', 'CONTRERAS, VICTOR RAYMUNDO', 'CONTRERAS, VICTOR RAYMUNDO', 'ROXAS', 'COD', 5000, 'INDIVI');

-- Create tickets table for support system
CREATE TABLE public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN',
  priority TEXT NOT NULL DEFAULT 'MEDIUM',
  created_by UUID REFERENCES auth.users(id),
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for tickets
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

-- Create policies for tickets
CREATE POLICY "Users can view their own tickets" 
ON public.tickets 
FOR SELECT 
USING (auth.uid() = created_by OR auth.uid() = assigned_to OR 
       EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Authenticated users can create tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update tickets they created or are assigned to" 
ON public.tickets 
FOR UPDATE 
USING (auth.uid() = created_by OR auth.uid() = assigned_to OR 
       EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create trigger for tickets timestamp updates
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();