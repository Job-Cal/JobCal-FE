import { redirect } from 'next/navigation';

export default function OAuthCallbackPage() {
  redirect('/login');
}
