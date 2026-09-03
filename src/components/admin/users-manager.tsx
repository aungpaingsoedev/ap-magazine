'use client';

import { useRouter } from 'next/navigation';
import { updateUserRole } from '@/actions/authors';
import { Select } from '@/components/admin/fields';
import type { User } from '@/lib/db/schema';

export function UsersManager({ users }: { users: User[] }) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto border border-neutral-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-neutral-200 bg-neutral-50 text-xs tracking-wider uppercase">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Role</th>
            <th className="px-4 py-3">Active</th>
          </tr>
        </thead>
        <tbody>
          {users.map((item) => (
            <tr key={item.id} className="border-b border-neutral-200 last:border-0">
              <td className="px-4 py-3 font-medium">{item.name}</td>
              <td className="px-4 py-3 text-neutral-500">{item.email}</td>
              <td className="px-4 py-3">
                <Select
                  defaultValue={item.role}
                  onChange={async (event) => {
                    await updateUserRole({
                      userId: item.id,
                      role: event.target.value,
                    });
                    router.refresh();
                  }}
                >
                  <option value="admin">Admin</option>
                  <option value="editor">Editor</option>
                  <option value="author">Author / writer</option>
                  <option value="media_manager">Media manager</option>
                  <option value="viewer">Viewer</option>
                </Select>
              </td>
              <td className="px-4 py-3">{item.active ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
