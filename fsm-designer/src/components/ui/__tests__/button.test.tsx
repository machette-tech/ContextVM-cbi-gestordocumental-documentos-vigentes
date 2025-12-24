import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  it('renders with default variant', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="default">Default Size</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };

    render(<Button onClick={handleClick}>Click me</Button>);
    const button = screen.getByRole('button', { name: /click me/i });

    await user.click(button);
    expect(clicked).toBe(true);
  });

  it('can be disabled', () => {
    render(<Button disabled>Disabled Button</Button>);
    const button = screen.getByRole('button', { name: /disabled button/i });
    expect(button).toBeDisabled();
  });

  it('renders as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    const link = screen.getByRole('link', { name: /link button/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });
});
