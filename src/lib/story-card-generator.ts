/**
 * Renders a 1080x1920 (9:16) Instagram Story / Reels Commemorative Postcard PNG
 * using HTML5 Canvas so travelers and the founder can 1-tap download & post to Instagram.
 */
export interface StoryCardConfig {
  storeName: string;
  area: string;
  signatureDish: string;
  welcomePerk: string;
  quote: string;
  senderName: string;
  instagramHandle: string;
  sealCode: string;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = 3
): number {
  const chars = Array.from(text || '');
  let line = '';
  let currentY = y;
  let lineCount = 0;

  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      ctx.fillText(line, x, currentY);
      line = chars[i];
      currentY += lineHeight;
      lineCount++;
      if (lineCount >= maxLines - 1) {
        const rest = chars.slice(i).join('');
        ctx.fillText(
          rest.length > 22 ? `${rest.slice(0, 22)}...` : rest,
          x,
          currentY
        );
        return currentY + lineHeight;
      }
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
    currentY += lineHeight;
  }
  return currentY;
}

export async function downloadInstagramStoryCardPng(config: StoryCardConfig): Promise<void> {
  if (typeof document === 'undefined') return;

  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Dark Emerald / Slate Luxury Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1920);
  bgGrad.addColorStop(0, '#062C21');
  bgGrad.addColorStop(0.5, '#0F172A');
  bgGrad.addColorStop(1, '#1E1B4B');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1080, 1920);

  // 2. Inner Japanese Washi Postcard Frame
  ctx.fillStyle = '#FCF9F2';
  ctx.beginPath();
  ctx.roundRect(64, 140, 952, 1520, 48);
  ctx.fill();

  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 8;
  ctx.stroke();

  // 3. Top Header Ribbon
  ctx.fillStyle = '#991B1B';
  ctx.beginPath();
  ctx.roundRect(114, 200, 560, 58, 29);
  ctx.fill();

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('💮 VEGAN.JP • 旅の美食御朱印帳', 142, 238);

  // 4. Traditional Red Vermilion Goshuin Hanko Seal (Top Right)
  ctx.save();
  ctx.translate(850, 310);
  ctx.rotate((-10 * Math.PI) / 180);
  ctx.beginPath();
  ctx.arc(0, 0, 115, 0, Math.PI * 2);
  ctx.fillStyle = '#FFF1F2';
  ctx.fill();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#E11D48';
  ctx.stroke();

  ctx.fillStyle = '#BE123C';
  ctx.textAlign = 'center';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('VEGAN.JP', 0, -42);
  ctx.font = '900 38px sans-serif';
  ctx.fillText('完食御朱印', 0, 8);
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(new Date().toLocaleDateString('ja-JP'), 0, 48);
  ctx.restore();

  ctx.textAlign = 'left';

  // 5. Store Name & Area
  ctx.fillStyle = '#0F172A';
  ctx.font = '900 54px sans-serif';
  const nextY = wrapText(ctx, config.storeName, 114, 355, 590, 68, 2);

  ctx.fillStyle = '#B45309';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(`📍 ${config.area}   •   #${config.sealCode}`, 114, nextY + 20);

  // 6. Pillar 1 Box: Signature Dish
  ctx.fillStyle = '#FEF3C7';
  ctx.beginPath();
  ctx.roundRect(114, 540, 852, 290, 32);
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.fillStyle = '#92400E';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('👑 ここに来たら絶対これ！看板の一皿 / SIGNATURE DISH', 150, 600);

  ctx.fillStyle = '#0F172A';
  ctx.font = '900 42px sans-serif';
  wrapText(ctx, config.signatureDish, 150, 670, 780, 56, 2);

  // 7. Welcome Perk Box
  ctx.fillStyle = '#064E3B';
  ctx.beginPath();
  ctx.roundRect(114, 870, 852, 210, 32);
  ctx.fill();

  ctx.fillStyle = '#6EE7B7';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText('🎁 VEGAN.JP 画面提示の歓迎特典 / WELCOME PERK', 150, 928);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px sans-serif';
  wrapText(ctx, config.welcomePerk, 150, 985, 780, 44, 2);

  // 8. Traveler Quote Box
  ctx.fillStyle = '#FFF1F2';
  ctx.beginPath();
  ctx.roundRect(114, 1120, 852, 310, 32);
  ctx.fill();
  ctx.strokeStyle = '#FECDD3';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#881337';
  ctx.font = 'bold 34px sans-serif';
  wrapText(ctx, `“${config.quote}”`, 150, 1195, 780, 50, 3);

  ctx.fillStyle = '#9F1239';
  ctx.font = 'bold 26px sans-serif';
  ctx.fillText(`— ${config.senderName}`, 150, 1385);

  // 9. Instagram Mention Strip inside Card
  ctx.fillStyle = '#0F172A';
  ctx.font = 'bold 30px sans-serif';
  ctx.fillText(
    `📸 Mention: ${config.instagramHandle}  @vegan.jp`,
    114,
    1520
  );
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText(
    'ストーリーズでメンションすると店舗公式アカウントにも届きます✨',
    114,
    1568
  );

  // 10. Footer Brand Callout
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.font = '900 40px sans-serif';
  ctx.fillText('🔍 「vegan.jp」で検索して歓迎特典＆御朱印をGET', 540, 1765);
  ctx.fillStyle = '#6EE7B7';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('https://vegan.jp — The Plant-Based Culinary Map of Japan', 540, 1825);

  // Trigger download
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = `vegan-jp-postcard-${Date.now()}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Track metric on backend
  try {
    fetch('/api/growth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'track_metric',
        metric: 'instagram_story_downloads',
      }),
    });
  } catch {}
}
