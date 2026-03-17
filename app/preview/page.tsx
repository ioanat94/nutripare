export default function PreviewPage() {
  return (
    <div className='min-h-screen bg-background text-foreground p-12 space-y-10'>
      <h1 className='text-3xl font-bold'>Theme Preview</h1>

      {/* Swatches */}
      <section className='space-y-2'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>Colors</h2>
        <div className='flex flex-wrap gap-3'>
          {[
            ['bg-primary', 'primary'],
            ['bg-secondary', 'secondary'],
            ['bg-accent', 'accent'],
            ['bg-muted', 'muted'],
            ['bg-destructive', 'destructive'],
            ['bg-warning', 'warning'],
            ['bg-info', 'info'],
            ['bg-card', 'card'],
            ['bg-border border border-border', 'border'],
          ].map(([cls, label]) => (
            <div key={label} className='flex flex-col items-center gap-1'>
              <div className={`w-16 h-16 rounded-lg ${cls}`} />
              <span className='text-xs text-muted-foreground'>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className='space-y-2'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>Typography</h2>
        <p className='text-foreground text-2xl font-bold'>Foreground bold</p>
        <p className='text-muted-foreground'>Muted foreground — secondary text</p>
        <p className='text-primary font-semibold'>Primary colored text</p>
        <p className='text-destructive'>Destructive / error text</p>
      </section>

      {/* Buttons */}
      <section className='space-y-2'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>Buttons</h2>
        <div className='flex flex-wrap gap-3'>
          <button className='bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80'>Primary</button>
          <button className='bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80'>Secondary</button>
          <button className='bg-destructive text-white px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80'>Destructive</button>
          <button className='bg-warning text-warning-foreground px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80'>Warning</button>
          <button className='bg-info text-info-foreground px-4 py-2 rounded-lg font-medium transition-opacity hover:opacity-80'>Info</button>
          <button className='border border-border text-foreground px-4 py-2 rounded-lg font-medium transition-colors hover:bg-accent hover:text-accent-foreground'>Outline</button>
        </div>
      </section>

      {/* Card */}
      <section className='space-y-2'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>Card</h2>
        <div className='bg-card text-card-foreground border border-border rounded-xl p-6 max-w-sm space-y-2'>
          <p className='font-semibold text-lg'>Card title</p>
          <p className='text-muted-foreground text-sm'>Some supporting text that sits inside the card surface.</p>
          <div className='bg-accent text-accent-foreground rounded-md px-3 py-1 text-sm inline-block'>Accent badge</div>
        </div>
      </section>

      {/* Input */}
      <section className='space-y-2'>
        <h2 className='text-sm font-semibold text-muted-foreground uppercase tracking-wider'>Input</h2>
        <input
          className='bg-background border border-input text-foreground rounded-lg px-3 py-2 w-64 outline-none focus:ring-2 focus:ring-ring'
          placeholder='Focus to see ring color'
        />
      </section>
    </div>
  );
}
