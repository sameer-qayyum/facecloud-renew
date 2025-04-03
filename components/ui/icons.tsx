'use client';

import React from 'react';
import { 
  Stethoscope, 
  Heart, 
  Sparkles, 
  ClipboardCheck,
  Loader2
} from 'lucide-react';

/**
 * Optimized icon components for FaceCloud
 * Memoized for better performance
 */
export const Icons = {
  // Medical icons
  stethoscope: React.memo(function Steth(props: React.ComponentProps<typeof Stethoscope>) {
    return <Stethoscope {...props} />;
  }),
  heart: React.memo(function HeartIcon(props: React.ComponentProps<typeof Heart>) {
    return <Heart {...props} />;
  }),
  sparkles: React.memo(function SparklesIcon(props: React.ComponentProps<typeof Sparkles>) {
    return <Sparkles {...props} />;
  }),
  clipboard: React.memo(function ClipboardIcon(props: React.ComponentProps<typeof ClipboardCheck>) {
    return <ClipboardCheck {...props} />;
  }),
  
  // UI icons
  spinner: React.memo(function SpinnerIcon(props: React.ComponentProps<typeof Loader2>) {
    return <Loader2 {...props} />;
  })
};
