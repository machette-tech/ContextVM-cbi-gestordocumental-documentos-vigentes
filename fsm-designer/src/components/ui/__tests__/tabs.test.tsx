import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../tabs';

describe('Tabs Component', () => {
  const TabsExample = () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">Content 1</TabsContent>
      <TabsContent value="tab2">Content 2</TabsContent>
      <TabsContent value="tab3">Content 3</TabsContent>
    </Tabs>
  );

  it('renders all tabs triggers', () => {
    render(<TabsExample />);
    expect(screen.getByText('Tab 1')).toBeInTheDocument();
    expect(screen.getByText('Tab 2')).toBeInTheDocument();
    expect(screen.getByText('Tab 3')).toBeInTheDocument();
  });

  it('shows default tab content', () => {
    render(<TabsExample />);
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('switches tab content when clicking triggers', async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    // Initially shows Content 1
    expect(screen.getByText('Content 1')).toBeInTheDocument();

    // Click on Tab 2
    const tab2Trigger = screen.getByText('Tab 2');
    await user.click(tab2Trigger);

    // Should show Content 2
    expect(screen.getByText('Content 2')).toBeInTheDocument();

    // Click on Tab 3
    const tab3Trigger = screen.getByText('Tab 3');
    await user.click(tab3Trigger);

    // Should show Content 3
    expect(screen.getByText('Content 3')).toBeInTheDocument();
  });

  it('applies active state to selected tab', async () => {
    const user = userEvent.setup();
    render(<TabsExample />);

    const tab1 = screen.getByText('Tab 1');
    const tab2 = screen.getByText('Tab 2');

    // Tab 1 should be active initially
    expect(tab1).toHaveAttribute('data-state', 'active');
    expect(tab2).toHaveAttribute('data-state', 'inactive');

    // Click Tab 2
    await user.click(tab2);

    // Tab 2 should be active now
    expect(tab2).toHaveAttribute('data-state', 'active');
    expect(tab1).toHaveAttribute('data-state', 'inactive');
  });
});
