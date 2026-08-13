import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import './design/fonts';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container missing from index.html');
}

// Dev-only screen gallery: `?preview=lobby` renders a screen against mock data
// for layout review. The DEV guard keeps it out of production bundles entirely.
const previewScreen = import.meta.env.DEV
  ? new URLSearchParams(window.location.search).get('preview')
  : null;

async function mount() {
  if (previewScreen !== null) {
    const { PreviewGallery } = await import('./dev/PreviewGallery');
    createRoot(container as HTMLElement).render(
      <StrictMode>
        <PreviewGallery screen={previewScreen} />
      </StrictMode>,
    );
    return;
  }

  createRoot(container as HTMLElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void mount();
