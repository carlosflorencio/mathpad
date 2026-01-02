'use client';

interface HelpProps {
  close: () => void;
}

export function Help({ close }: HelpProps) {
  return (
    <div className="fixed inset-0 bg-[hsl(220,13%,18%)] text-[rgba(214,221,209)] p-8 overflow-auto">
      <h1 className="text-2xl mb-4">Help</h1>
      <p className="mb-4">Documentation will be added here.</p>
      
      <div
        className="fixed top-4 right-8 underline cursor-pointer"
        onClick={() => close()}
      >
        Close
      </div>
    </div>
  );
}
