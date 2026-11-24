import { redirect } from 'next/navigation';

/** Orders & SIPs opens on its SIP list. */
export default function OrdersPage(): never {
  redirect('/orders/sips');
}
