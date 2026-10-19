'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export type NavLang = 'en' | 'ja' | 'zh-TW' | 'ko' | 'fr' | 'es';

interface AppSidebarProps {
    lang?: NavLang;
    onLangChange?: (lang: NavLang) => void;
}

const LANG_OPTIONS: { code: NavLang; label: string }[] = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'EN' },
    { code: 'zh-TW', label: '繁體' },
    { code: 'ko', label: '한국어' },
    { code: 'fr', label: 'FR' },
    { code: 'es', label: 'ES' },
];

export default function AppSidebar({ lang = 'ja', onLangChange }: AppSidebarProps) {
    const pathname = usePathname();
    const isJa = lang === 'ja';

    const navItems = [
        {
            href: '/',
            label: isJa ? 'マップ＆御朱印帳' : 'Map & Stamp Book',
            badge: isJa ? '旅人' : 'Map',
            icon: (
                <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" />
                    <line x1="15" y1="6" x2="15" y2="21" />
                </svg>
            ),
        },
        {
            href: '/partner',
            label: isJa ? '店舗オーナースタジオ' : 'Partner Studio',
            badge: isJa ? '店舗' : 'Store',
            icon: (
                <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
            ),
        },
        {
            href: '/growth',
            label: isJa ? '自動集客＆自己修復' : 'Growth & Auto-Heal',
            badge: 'Auto',
            icon: (
                <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                </svg>
            ),
        },
        {
            href: '/guide',
            label: isJa ? '活用ガイド・Q&A' : 'How It Works & FAQ',
            icon: (
                <svg className="size-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
            ),
        },
    ];

    const isPartnerPage = pathname === '/partner';

    return (
        <>
            {/* Desktop Fixed Left Sidebar */}
            <aside className="hidden lg:flex flex-col justify-between w-[248px] shrink-0 h-dvh sticky top-0 border-r border-[#DCECE3] bg-[#F7FBF8] px-3.5 py-4 select-none z-30">
                <div className="space-y-4">
                    {/* Brand Identity */}
                    <div className="flex items-center justify-between px-1">
                        <Link href="/" className="flex items-center gap-2.5 group">
                            <div className="size-9 rounded-[11px] bg-[#16A34A] text-white flex items-center justify-center shadow-[0_3px_10px_rgba(22,163,74,0.28)] group-hover:scale-105 group-active:scale-95 transition-transform">
                                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                                </svg>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                                <span className="text-[18px] font-extrabold tracking-tight text-[#1C2822]">
                                    Vegan.jp
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#DCECE3] text-[#15803D]">
                                    Japan
                                </span>
                            </div>
                        </Link>
                    </div>

                    {/* Primary Quick Action Pill Button */}
                    <Link
                        href="/"
                        className="w-full h-10 rounded-full border-[1.5px] border-[#C5DDD0] bg-white hover:bg-[#EEF7F2] text-[#1C2822] font-bold text-xs flex items-center justify-center gap-2 shadow-[0_2px_6px_rgba(20,40,30,0.03)] active:scale-95 transition-all"
                    >
                        <svg className="size-3.5 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                            <polygon points="3 11 22 2 13 21 11 13 3 11" />
                        </svg>
                        <span>{isJa ? 'ライブマップを開く' : 'Open Live Map'}</span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="space-y-1 pt-1">
                        {navItems.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center justify-between h-10 px-3 rounded-[13px] text-[13px] transition-all active:scale-[0.98] ${
                                        active
                                            ? 'bg-[#DCECE3]/90 text-[#14532D] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.6)]'
                                            : 'text-[#4A5D52] hover:bg-[#EAF4EE] hover:text-[#1C2822] font-semibold'
                                    }`}
                                >
                                    <span className="flex items-center gap-2.5 truncate">
                                        <span className={active ? 'text-[#16A34A]' : 'text-[#687D70]'}>
                                            {item.icon}
                                        </span>
                                        <span className="truncate">{item.label}</span>
                                    </span>
                                    {item.badge && (
                                        <span
                                            className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                                                active
                                                    ? 'bg-[#16A34A] text-white'
                                                    : 'bg-[#E3F0E8] text-[#4A5D52]'
                                            }`}
                                        >
                                            {item.badge}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom Trust & Language Section */}
                <div className="space-y-3">
                    {onLangChange && (
                        <div className="bg-[#EEF7F2] p-1 rounded-[14px] border border-[#DCECE3] grid grid-cols-3 gap-1">
                            {LANG_OPTIONS.map((opt) => (
                                <button
                                    key={opt.code}
                                    type="button"
                                    onClick={() => onLangChange(opt.code)}
                                    className={`h-7 rounded-[10px] text-[11px] font-bold transition-all active:scale-95 ${
                                        lang === opt.code
                                            ? 'bg-white text-[#1C2822] shadow-xs'
                                            : 'text-[#5A6E62] hover:text-[#1C2822]'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="nani-dashed p-3.5 bg-[#F2F9F5]/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#15803D]">
                            <svg className="size-4 shrink-0 text-[#16A34A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                            <span>{isJa ? '完全無料・なりすまし防止済' : '100% Free & Verified'}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-[#526358] mt-1 font-medium">
                            {isJa
                                ? '「看板の一皿」と「完食御朱印」で訪日客と名店を最短でつなぎます。'
                                : 'Connecting travelers and chefs via Signature Dishes & Collectible Stamps.'}
                        </p>
                        <Link
                            href={isPartnerPage ? '/growth' : '/partner'}
                            className="mt-2.5 w-full h-9 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-[0_3px_10px_rgba(22,163,74,0.22)] active:scale-95 transition-all"
                        >
                            <span>
                                {isPartnerPage
                                    ? isJa ? '9:16 宣伝ストーリーズ作成' : 'Create 9:16 Story Card'
                                    : isJa ? '店舗オーナースタジオへ' : 'Open Partner Studio'}
                            </span>
                            <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="5" y1="12" x2="19" y2="12" />
                                <polyline points="12 5 19 12 12 19" />
                            </svg>
                        </Link>
                    </div>
                </div>
            </aside>

            {/* Mobile / Tablet Floating Header */}
            <header className="lg:hidden sticky top-2.5 z-40 px-3 pt-2">
                <div className="max-w-2xl mx-auto rounded-full bg-white/95 backdrop-blur-md border border-[#DCECE3] shadow-[0_6px_20px_rgba(20,40,30,0.06)] px-3 py-1.5 flex items-center justify-between gap-2">
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="size-7 rounded-[9px] bg-[#16A34A] text-white flex items-center justify-center">
                            <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                            </svg>
                        </div>
                        <span className="font-extrabold text-sm text-[#1C2822]">Vegan.jp</span>
                    </Link>

                    <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                        {navItems.map((item) => {
                            const active = pathname === item.href;
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all active:scale-95 ${
                                        active
                                            ? 'bg-[#1C2822] text-white'
                                            : 'text-[#4A5D52] hover:bg-[#EEF7F2]'
                                    }`}
                                >
                                    {item.href === '/'
                                        ? isJa ? 'マップ' : 'Map'
                                        : item.href === '/partner'
                                        ? isJa ? '店舗スタジオ' : 'Partner'
                                        : item.href === '/growth'
                                        ? isJa ? '自動集客' : 'Growth'
                                        : isJa ? 'ガイド' : 'Guide'}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </header>
        </>
    );
}
