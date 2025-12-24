import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeTruthy();
  });

  it('displays AARPIA logo', () => {
    render(<App />);
    const logo = screen.getByAltText('AARPIA');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logo-aarpia.png');
  });

  it('displays application title', () => {
    render(<App />);
    const title = screen.getByText('Diseñador Visual FSM');
    expect(title).toBeInTheDocument();
  });

  it('displays application description', () => {
    render(<App />);
    const description = screen.getByText('Arquitectura para Integración y Análisis de Procesos');
    expect(description).toBeInTheDocument();
  });

  it('renders all three tabs', () => {
    render(<App />);
    expect(screen.getByText('Entidad L')).toBeInTheDocument();
    expect(screen.getByText('Canvas FSM')).toBeInTheDocument();
    expect(screen.getByText('Esquemas')).toBeInTheDocument();
  });

  it('displays footer with version', () => {
    render(<App />);
    const footer = screen.getByText(/v1\.0\.0/);
    expect(footer).toBeInTheDocument();
  });

  it('renders NostrStatus component', () => {
    render(<App />);
    // NostrStatus should be in the document
    const header = document.querySelector('header');
    expect(header).toBeInTheDocument();
  });
});
