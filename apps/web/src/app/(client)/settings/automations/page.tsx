export default function TicketAutomationsPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 py-6 pr-4.5 pl-6">
      <Breadcrumbs
        pages={settingsTicketAutomationsBreadcrumbs}
        className="px-2"
      />
    </div>
  );
}
