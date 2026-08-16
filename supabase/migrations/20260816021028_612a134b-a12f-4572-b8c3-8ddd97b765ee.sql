ALTER TYPE public.venda_status ADD VALUE IF NOT EXISTS 'em_andamento';
ALTER TYPE public.venda_status ADD VALUE IF NOT EXISTS 'efetuada';
ALTER TYPE public.venda_status ADD VALUE IF NOT EXISTS 'falta_pagamento';