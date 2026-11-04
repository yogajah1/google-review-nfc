import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCard, incrementScan } from '@/lib/db';
import ClientCardView from './ClientCardView';
import ActiveCardRedirect from './ActiveCardRedirect';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ verified?: string; manage?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    return { title: 'Kartu Tidak Ditemukan - Google Review NFC' };
  }

  if (card.status === 'active' && card.store_name) {
    return {
      title: `Beri Ulasan Bintang 5 untuk ${card.store_name}`,
      description: `Beri ulasan dan rating terbaik Anda untuk ${card.store_name} di Google Maps.`,
    };
  }

  return {
    title: `Aktivasi Kartu Google Review (${card.id})`,
    description: 'Aktivasi kartu Google Review fisik Anda sekarang.',
  };
}

export default async function CardPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { verified, manage } = await searchParams;
  const card = await getCard(id);

  if (!card) {
    return notFound();
  }

  // Jika kartu aktif dan diakses customer biasa (bukan baru verifikasi & bukan klik kelola)
  // Langsung lakukan smart mobile redirect ke Google Maps Review!
  if (card.status === 'active' && !verified && !manage && card.google_review_url) {
    // Increment scan counter
    await incrementScan(card.id);
    return <ActiveCardRedirect card={card} />;
  }

  return (
    <ClientCardView 
      card={card} 
      justVerified={verified === '1'} 
    />
  );
}
