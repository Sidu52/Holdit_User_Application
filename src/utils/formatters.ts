import { format, parseISO } from 'date-fns';

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (dateString: string, dateFormat: string = 'PPP'): string => {
  try {
    const date = parseISO(dateString);
    return format(date, dateFormat);
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    return format(date, 'p');
  } catch {
    return dateString;
  }
};
