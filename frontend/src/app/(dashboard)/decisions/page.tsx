export default function DecisionsPage() {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-center">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Human Decisions</h1>
      <p className="text-gray-500">No pending escalations. The agent hasn't flagged any clinical tasks for your review yet.</p>
    </div>
  );
}
