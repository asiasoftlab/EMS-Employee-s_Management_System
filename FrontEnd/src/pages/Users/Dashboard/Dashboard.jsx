import './Dashboard.css';

export default function Dashboard({ user }) {
  if (!user) return null;

  return (
    <h1>Dashboard</h1>
  );
}
