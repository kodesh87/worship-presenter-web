'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface ServiceRow {
  id: number;
  date: string;
  parsed_data: string | null;
  created_at: string;
}

interface ParsedRundown {
  date: string | null;
  sermon: {
    speaker: string;
    title: string;
  } | null;
}

function formatDateTime(isoString: string) {
  if (!isoString) return '';
  const utcString = isoString.includes('Z') || isoString.includes('+') 
    ? isoString 
    : `${isoString.replace(' ', 'T')}Z`;
  const d = new Date(utcString);
  if (isNaN(d.getTime())) return isoString;
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return `${dateStr} ${timeStr}`;
}

function formatServiceDate(dateStr: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  return dateStr;
}

export default function ServicesList({ services }: { services: ServiceRow[] }) {
  const [query, setQuery] = useState('');

  const filteredServices = services.filter((svc) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;

    let parsed: ParsedRundown | null = null;
    try {
      parsed = svc.parsed_data ? JSON.parse(svc.parsed_data) as ParsedRundown : null;
    } catch (e) {
      // ignore
    }

    const speaker = (parsed?.sermon?.speaker || '').toLowerCase();
    const title = (parsed?.sermon?.title || '').toLowerCase();
    const date = svc.date.toLowerCase();
    const dateFormatted = formatServiceDate(svc.date).toLowerCase();

    return (
      speaker.includes(q) ||
      title.includes(q) ||
      date.includes(q) ||
      dateFormatted.includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Search Input Box */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-muted-foreground/60">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
            </svg>
          </span>
          <input
            type="text"
            className="w-full p-2.5 pl-10 pr-10 text-xs bg-card/60 border border-border/80 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground/50 text-foreground transition-all"
            placeholder="Search by sermon title, speaker, or date..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <Button render={<Link href="/services/new" />} variant="default" className="shadow-sm rounded-xl cursor-pointer w-full sm:w-auto">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-4 mr-1 text-primary-foreground">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          New Service
        </Button>
      </div>

      {filteredServices.length === 0 ? (
        <div className="border border-border/80 bg-card/45 backdrop-blur-md rounded-2xl p-12 text-center shadow-sm max-w-md mx-auto mt-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-4 border border-primary/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-foreground">No Services Found</h3>
          <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
            Try adjusting your search query or waiting for Telegram payload.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredServices.map((svc) => {
            let parsed: ParsedRundown | null = null;
            try {
              parsed = svc.parsed_data ? JSON.parse(svc.parsed_data) as ParsedRundown : null;
            } catch (e) {
              // ignore
            }
            const speaker = parsed?.sermon?.speaker || '';
            const title = parsed?.sermon?.title || 'Worship Service';
            
            const serviceDateFormatted = formatServiceDate(svc.date);
            const createdDateFormatted = formatDateTime(svc.created_at);

            return (
              <Link key={svc.id} href={`/services/${svc.id}`} className="block group">
                <div className="h-full border border-border/80 bg-card/40 backdrop-blur-md p-6 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        #{svc.id}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="font-bold text-base text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors duration-200">
                        {title}
                      </h3>
                      {speaker && (
                        <p className="text-xs text-muted-foreground/90 font-medium flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 text-muted-foreground/60">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                          {speaker}
                        </p>
                      )}
                      <p className="text-xs font-semibold text-muted-foreground pt-1">
                        {serviceDateFormatted}
                      </p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/60 mt-5 flex justify-between items-center text-[10px] text-muted-foreground">
                    <span>
                      Generated: {createdDateFormatted} by PicoClaw
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
