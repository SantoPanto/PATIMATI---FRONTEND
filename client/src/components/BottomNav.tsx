import { Link } from "wouter";

export default function BottomNav() {
  return (
    <nav className="bottom-nav">
      <Link href="/">Home</Link>
      <Link href="/listings">Listings</Link>
      <Link href="/add-listing">Add</Link>
      <Link href="/chat">Chat</Link>
      <Link href="/profile">Profile</Link>
    </nav>
  );
}
