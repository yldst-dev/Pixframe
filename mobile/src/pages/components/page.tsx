import { useState } from 'react';
import Button from '../../components/ui/button';
import IconButton from '../../components/ui/icon-button';
import Toggle from '../../components/ui/toggle';
import AddIcon from '../../icons/add.icon';
import SettingsIcon from '../../icons/settings.icon';
import DownloadIcon from '../../icons/download.icon';
import ImageIcon from '../../icons/image.icon';
import GitHubIcon from '../../icons/github.icon';

const ComponentsPage = () => {
  const [toggle1, setToggle1] = useState(false);
  const [toggle2, setToggle2] = useState(true);
  const [toggle3, setToggle3] = useState(false);

  return (
    <div className="min-h-screen bg-background p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="border-b border-border pb-6">
          <h1 className="text-3xl font-bold uppercase tracking-tight mb-2">Design System / Components</h1>
          <p className="text-muted-foreground font-mono">Reusable UI components overview</p>
        </header>

        {/* Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold uppercase border-l-4 border-primary pl-3">Buttons</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4 p-6 border border-border bg-card">
              <h3 className="font-mono text-sm text-muted-foreground mb-4">VARIANTS</h3>
              <div className="flex flex-wrap gap-4 items-center">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
            </div>

            <div className="space-y-4 p-6 border border-border bg-card">
              <h3 className="font-mono text-sm text-muted-foreground mb-4">SIZES</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>

            <div className="space-y-4 p-6 border border-border bg-card">
              <h3 className="font-mono text-sm text-muted-foreground mb-4">WITH ICONS</h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">
                  <span className="mr-2"><AddIcon size={16} /></span>
                  Add Photo
                </Button>
                <Button variant="outline">
                  <span className="mr-2"><DownloadIcon size={16} /></span>
                  Download
                </Button>
              </div>
            </div>

            <div className="space-y-4 p-6 border border-border bg-card">
              <h3 className="font-mono text-sm text-muted-foreground mb-4">STATES</h3>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button variant="primary" disabled>Disabled Primary</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Icon Buttons Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold uppercase border-l-4 border-primary pl-3">Icon Buttons</h2>
          
          <div className="p-6 border border-border bg-card">
            <div className="flex flex-wrap gap-8 items-center">
              <div className="space-y-2 text-center">
                <div className="font-mono text-xs text-muted-foreground">PRIMARY</div>
                <IconButton variant="primary"><SettingsIcon size={20} /></IconButton>
              </div>
              <div className="space-y-2 text-center">
                <div className="font-mono text-xs text-muted-foreground">SECONDARY</div>
                <IconButton variant="secondary"><ImageIcon size={20} /></IconButton>
              </div>
              <div className="space-y-2 text-center">
                <div className="font-mono text-xs text-muted-foreground">OUTLINE</div>
                <IconButton variant="outline"><GitHubIcon size={20} /></IconButton>
              </div>
              <div className="space-y-2 text-center">
                <div className="font-mono text-xs text-muted-foreground">GHOST</div>
                <IconButton variant="ghost"><AddIcon size={20} /></IconButton>
              </div>
              <div className="space-y-2 text-center">
                <div className="font-mono text-xs text-muted-foreground">DANGER</div>
                <IconButton variant="danger"><DownloadIcon size={20} /></IconButton>
              </div>
            </div>
          </div>
        </section>

        {/* Toggles Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold uppercase border-l-4 border-primary pl-3">Toggles</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 border border-border bg-card space-y-6">
              <Toggle 
                checked={toggle1} 
                onChange={setToggle1} 
                label="Basic Toggle" 
              />
              <Toggle 
                checked={toggle2} 
                onChange={setToggle2} 
                label="Toggle with Description"
                description="This is a detailed description for the toggle switch."
              />
            </div>

            <div className="p-6 border border-border bg-card space-y-6">
              <Toggle 
                checked={toggle3} 
                onChange={setToggle3} 
                label="Small Size" 
                size="sm"
              />
              <Toggle 
                checked={true} 
                onChange={() => {}} 
                label="Disabled Checked" 
                disabled
              />
              <Toggle 
                checked={false} 
                onChange={() => {}} 
                label="Disabled Unchecked" 
                disabled
              />
            </div>
          </div>
        </section>

        {/* Colors Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold uppercase border-l-4 border-primary pl-3">Colors</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Background', class: 'bg-background', text: 'text-foreground', border: 'border-border' },
              { name: 'Foreground', class: 'bg-foreground', text: 'text-background', border: 'border-border' },
              { name: 'Primary', class: 'bg-primary', text: 'text-primary-foreground', border: 'border-primary' },
              { name: 'Secondary', class: 'bg-secondary', text: 'text-secondary-foreground', border: 'border-secondary' },
              { name: 'Muted', class: 'bg-muted', text: 'text-muted-foreground', border: 'border-border' },
              { name: 'Accent', class: 'bg-accent', text: 'text-accent-foreground', border: 'border-accent' },
              { name: 'Destructive', class: 'bg-destructive', text: 'text-destructive-foreground', border: 'border-destructive' },
              { name: 'Border', class: 'bg-border', text: 'text-foreground', border: 'border-border' },
            ].map((color) => (
              <div key={color.name} className={`p-4 border ${color.border} ${color.class} ${color.text} flex items-center justify-center h-24 text-sm font-bold uppercase`}>
                {color.name}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ComponentsPage;
