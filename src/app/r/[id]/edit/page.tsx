import { notFound } from 'next/navigation';
import { getCard } from '@/lib/db';
import ClientEditView from './ClientEditView';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditPage({ params }: Props) {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    return notFound();
  }

  // Cek apakah kartu sedang terkunci
  const isLocked = card.locked_until && new Date(card.locked_until).getTime() > Date.now();
  let remainingMinutes = 0;
  if (isLocked && card.locked_until) {
    remainingMinutes = Math.ceil((new Date(card.locked_until).getTime() - Date.now()) / (60 * 1000));
  }

  return (
    <ClientEditView 
      card={card}
      isInitiallyLocked={isLocked || false}
      initialLockedMinutes={remainingMinutes}
    />
  );
}
