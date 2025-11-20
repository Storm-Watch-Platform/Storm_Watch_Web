export default function FilterBar({ active, setActive }) {
  const filters = [
    { key: "all", label: "Tất cả" },
    { key: "rescue", label: "Cần cứu" },
    { key: "info", label: "Đội cứu hộ" },
    { key: "alert", label: "Cảnh báo" },
  ];

  return (
    <div className="flex gap-2 bg-white p-2 rounded-lg shadow absolute top-4 right-4 z-10">
      {filters.map(f => (
        <button
          key={f.key}
          onClick={() => setActive(f.key)}
          className={`px-3 py-1 rounded-full text-sm font-medium 
            ${active === f.key ? "bg-blue-600 text-white" : "bg-gray-100 hover:bg-gray-200"}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
