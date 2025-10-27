export default function Home() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">SilverLine B2B</h1>
        <div className="space-x-4">
          <a href="/admin/login" className="text-blue-600 hover:underline">Admin Login</a>
          <a href="/login" className="text-blue-600 hover:underline">Reseller Login</a>
        </div>
      </div>
    </div>
  );
}
