// /src/app/_components/holograph/UserList.tsx

import React from "react";
import { debugLog } from "../../../utils/debug";

export default function UserList({ users }) {
  if (!Array.isArray(users) || users.length === 0) {
    return <p className="text-gray-500">No users found.</p>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-4 mt-4">
      <h2 className="text-lg font-semibold">Current Users</h2>
      <ul>
        {users.map((user) => (
          <li key={user.id} className="border-b py-2">
            {user.name} ({user.email}) - {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
}