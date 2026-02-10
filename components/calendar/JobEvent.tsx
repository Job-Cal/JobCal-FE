'use client';

import { Application } from '@/types/application';
import { ApplicationStatusLabels } from '@/types/application';
import { Event } from 'react-big-calendar';

interface JobEventProps {
  event: Event;
}

export default function JobEvent({ event }: JobEventProps) {
  const app = (event as any).resource as Application | undefined;
  
  if (!app) {
    return <div className="text-xs p-1">{event.title}</div>;
  }
  
  return (
    <div className="text-xs p-1 w-full h-full">
      <div className="font-semibold leading-tight">{app.job_posting.company_name}</div>
      <div className="text-[10px] opacity-90 mt-0.5 leading-tight">
        {ApplicationStatusLabels[app.status]}
      </div>
    </div>
  );
}
