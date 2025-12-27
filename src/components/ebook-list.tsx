'use client';

import Image from 'next/image';
import { useEbooksByCategory } from '@/presentation/ebooks/queries/useEbookQueries';
import { usePremiumAccess } from '@/hooks/usePremiumAccess';
import { useSession } from 'next-auth/react';

type EbookListProps = {
  categoryName: string;
};

export function EbookList({ categoryName }: EbookListProps) {
  const { data: ebooks, isLoading, isError } = useEbooksByCategory(categoryName);

  const { data: session } = useSession();
  const userId = session?.user?.id as string | undefined;

  const { hasAccess, loading: loadingPremium } = usePremiumAccess(userId);
  const isPremium = hasAccess === true;

  if (isLoading || loadingPremium) {
    return <p>Carregando ebooks...</p>;
  }

  if (isError) {
    return <p>Erro ao carregar ebooks. Tente novamente mais tarde.</p>;
  }

  if (!ebooks || ebooks.length === 0) {
    return <p>Nenhum ebook encontrado para esta categoria.</p>;
  }

  const handleDownload = (downloadUrl: string) => {
    if (!isPremium) return;
    window.open(downloadUrl, '_blank');
  };

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {ebooks.map((ebook) => (
        <article
          key={ebook.id}
          className="flex flex-col rounded-lg border bg-white p-4 shadow-sm"
        >
          {ebook.coverUrl && (
            <div className="relative mb-3 h-48 w-full">
              <Image
                src={ebook.coverUrl}
                alt={ebook.title}
                fill
                className="rounded-md object-cover"
              />
            </div>
          )}

          <h3 className="mb-1 text-base font-semibold">{ebook.title}</h3>

          {ebook.description && (
            <p className="mb-3 text-sm text-muted-foreground line-clamp-3">
              {ebook.description}
            </p>
          )}

          <button
            type="button"
            onClick={() => handleDownload(ebook.downloadUrl)}
            disabled={!isPremium}
            className="mt-auto rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPremium ? 'Baixar ebook' : 'Disponível apenas para usuários premium'}
          </button>
        </article>
      ))}
    </section>
  );
}
