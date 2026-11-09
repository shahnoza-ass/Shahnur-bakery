import React, { useId, useState } from 'react';

export type ProductPicture = { url: string; publicId?: string; file?: File };

export function ProductPhotos({ pictures, onChange, onSelect, busy }: {
  pictures: ProductPicture[];
  onChange: (pictures: ProductPicture[]) => void;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  busy: boolean;
}) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, Math.max(0, pictures.length - 1));
  const move = (from: number, to: number) => {
    const next = [...pictures];
    [next[from], next[to]] = [next[to], next[from]];
    onChange(next);
    setSelected(to);
  };
  return <>
    <p className="pm-note">Telefon galereyasidan tanlang yoki kamerada suratga oling. Rasmlar mahsulotni saqlaganingizda yuklanadi.</p>
    <div className="pm-photo-actions">
      <label className={`pm-file-picker ${busy || pictures.length >= 5 ? 'is-disabled' : ''}`}>
        <span aria-hidden="true">▧</span> Galereyadan tanlash
        <input id={`${id}-gallery`} className="pm-file-input" type="file" multiple accept="image/*" disabled={busy || pictures.length >= 5} onChange={onSelect} />
      </label>
      <label className={`pm-file-picker ${busy || pictures.length >= 5 ? 'is-disabled' : ''}`}>
        <span aria-hidden="true">◎</span> Kameradan olish
        <input id={`${id}-camera`} className="pm-file-input" type="file" accept="image/*" capture="environment" disabled={busy || pictures.length >= 5} onChange={onSelect} />
      </label>
    </div>
    <p className="pm-photo-count" role="status">{pictures.length} / 5 ta rasm · Har biri 30 MB gacha, avtomatik kichraytiriladi.</p>
    <p className="pm-note">JPG, PNG yoki WEBP tanlang. Telefon HEIC rasmini ocholmasa, kameradan yangi surat oling yoki JPG tanlang.</p>
    {!!pictures.length && <>
      <button type="button" className="pm-preview-toggle" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? 'Katta rasmni yopish' : 'Rasmni kattalashtirib ko‘rish'}</button>
      {expanded && <figure className="pm-photo-preview"><img src={pictures[index].url} alt={`${index + 1}-rasmning katta ko‘rinishi`} /><figcaption>{index + 1}-rasm {index === 0 ? '· Katalogdagi asosiy rasm' : ''}</figcaption></figure>}
    </>}
    <div className="pm-pictures">{pictures.map((picture, i) => <div key={picture.url + i}>
      <button type="button" className="pm-thumbnail" aria-label={`${i + 1}-rasmni kattalashtirish`} onClick={() => { setSelected(i); setExpanded(true); }}><img src={picture.url} alt={`Mahsulot rasmi ${i + 1}`} /></button>
      <button type="button" className="pm-remove-photo" aria-label={`${i + 1}-rasmni olib tashlash`} onClick={() => onChange(pictures.filter((_, n) => n !== i))}>×</button>
      <button type="button" className="pm-main-photo" aria-pressed={i === 0} onClick={() => { onChange([picture, ...pictures.filter((_, n) => n !== i)]); setSelected(0); }}>{i === 0 ? '✓ Asosiy rasm' : 'Asosiy qilish'}</button>
      <div className="pm-photo-order"><button type="button" disabled={i === 0} aria-label={`${i + 1}-rasmni oldinga o‘tkazish`} onClick={() => move(i, i - 1)}>←</button><span>{i + 1}</span><button type="button" disabled={i === pictures.length - 1} aria-label={`${i + 1}-rasmni keyinga o‘tkazish`} onClick={() => move(i, i + 1)}>→</button></div>
    </div>)}</div>
  </>;
}
