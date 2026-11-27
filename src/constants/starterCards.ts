import type { Language } from '../i18n/translations';

export interface MotivationalCardRow {
  id: string;
  title: string;
  front_content: string;
  back_content: string | null;
  category: string;
  author: string | null;
  language?: string;
}

const STARTER_CARDS_ID: Record<
  string,
  { title: string; front: string; back: string; category: string }
> = {
  "You don't have to figure everything out today.": {
    title: 'Selangkah Demi Selangkah',
    front: 'Kamu tidak harus menyelesaikan semuanya hari ini.',
    back: 'Kemajuan tidak selalu tentang bergerak lebih cepat. Terkadang artinya memberi dirimu ruang untuk beristirahat dan melangkah pelan ke depan.',
    category: 'Cinta Diri',
  },
  'You are more capable than you think.': {
    title: 'Kamu Cukup',
    front: 'Kamu jauh lebih mampu dari yang kamu kira.',
    back: 'Setiap tantangan yang pernah kamu hadapi telah membuatmu lebih kuat. Percayalah pada dirimu sendiri.',
    category: 'Kepercayaan Diri',
  },
  'When stress feels overwhelming, pause and breathe.': {
    title: 'Tarik Napas',
    front: 'Saat stres terasa berat, berhenti sejenak dan tarik napas.',
    back: 'Tarik napas perlahan selama 4 hitungan, tahan 4 hitungan, lalu hembuskan 4 hitungan. Tubuh dan pikiranmu membutuhkannya.',
    category: 'Kelola Stres',
  },
  'Rest is not laziness — it is recovery.': {
    title: 'Istirahat Itu Produktif',
    front: 'Istirahat bukanlah kemalasan — itu adalah pemulihan.',
    back: 'Otak dan tubuhmu membutuhkan waktu jeda untuk memulihkan energi dan menjaga fokus belajarmu.',
    category: 'Pengembangan Diri',
  },
  'Whatever you are feeling right now is okay.': {
    title: 'Perasaanmu Valid',
    front: 'Apa pun yang kamu rasakan saat ini, itu tidak apa-apa.',
    back: 'Kamu tidak perlu membenarkan emosimu. Emosi adalah sinyal, bukan kelemahan. Kenali dan perlakukan dirimu dengan lembut.',
    category: 'Kesadaran Emosi',
  },
};

export function localizeCard(
  card: MotivationalCardRow,
  language: Language
): MotivationalCardRow {
  if (language === 'id' && card.language !== 'id') {
    const tr = STARTER_CARDS_ID[card.front_content];
    if (tr) {
      return {
        ...card,
        title: tr.title,
        front_content: tr.front,
        back_content: tr.back,
        category: tr.category,
      };
    }
  }
  return card;
}

export function filterCardsByLanguage(
  cards: MotivationalCardRow[],
  language: Language
): MotivationalCardRow[] {
  const langCards = cards.filter((c) => c.language === language);
  const pool = langCards.length > 0 ? langCards : cards;
  return pool.map((c) => localizeCard(c, language));
}
