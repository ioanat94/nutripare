import { PolicyContext, useUI } from '@firebase-oss/ui-react';

import { cn } from '@/utils/tailwind';
import { getTranslation } from '@firebase-oss/ui-core';
import { useContext } from 'react';

export function Policies() {
  const ui = useUI();
  const policies = useContext(PolicyContext);

  if (!policies) {
    return null;
  }

  const { termsOfServiceUrl, privacyPolicyUrl, onNavigate } = policies;
  const termsAndPrivacyText = getTranslation(ui, 'messages', 'termsAndPrivacy');
  const parts = termsAndPrivacyText.split(/(\{tos\}|\{privacy\})/);

  const linkClass = cn('hover:underline font-semibold');

  function PolicyLink({ url, label }: { url: string | URL; label: string }) {
    if (onNavigate) {
      return (
        <button className={linkClass} onClick={() => onNavigate(url)}>
          {label}
        </button>
      );
    }
    return (
      <a
        href={url.toString()}
        target='_blank'
        rel='noopener noreferrer'
        className={linkClass}
      >
        {label}
      </a>
    );
  }

  return (
    <div className='text-text-muted text-center text-xs'>
      {parts.map((part: string, index: number) => {
        if (part === '{tos}') {
          return (
            <PolicyLink
              key={index}
              url={termsOfServiceUrl}
              label={getTranslation(ui, 'labels', 'termsOfService')}
            />
          );
        }

        if (part === '{privacy}') {
          return (
            <PolicyLink
              key={index}
              url={privacyPolicyUrl}
              label={getTranslation(ui, 'labels', 'privacyPolicy')}
            />
          );
        }

        return <span key={index}>{part}</span>;
      })}
    </div>
  );
}
