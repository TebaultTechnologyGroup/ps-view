import { useState } from 'react'
import { ActionIcon, Button, Group, Modal, Stack, Table, Text, TextInput, Title, Tooltip } from '@mantine/core'
import { useForm } from '@mantine/form'
import { useDisclosure } from '@mantine/hooks'
import { IconEdit, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'

interface Customer {
  id: string
  name: string
}

// TODO: replace with Supabase once the backend is implemented
const initialCustomers: Customer[] = [
  { id: '1', name: 'Acme Incorporated' },
  { id: '2', name: 'Globex Corporation' },
  { id: '3', name: 'Initech' },
]

export default function Customers() {
  const [customers, setCustomers] = useState(initialCustomers)
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState<Customer | null>(null)
  const [formOpened, formHandlers] = useDisclosure(false)

  const form = useForm({
    initialValues: { name: '' },
    validate: {
      name: (value) => {
        const name = value.trim()
        if (!name) return 'Name is required'
        const duplicate = customers.some(
          (c) => c.id !== editing?.id && c.name.toLowerCase() === name.toLowerCase(),
        )
        return duplicate ? 'A customer with this name already exists' : null
      },
    },
  })

  const openCreate = () => {
    setEditing(null)
    form.setValues({ name: '' })
    form.resetDirty()
    form.clearErrors()
    formHandlers.open()
  }

  const openEdit = (customer: Customer) => {
    setEditing(customer)
    form.setValues({ name: customer.name })
    form.resetDirty()
    form.clearErrors()
    formHandlers.open()
  }

  const handleSubmit = ({ name }: { name: string }) => {
    const trimmed = name.trim()
    if (editing) {
      setCustomers((prev) => prev.map((c) => (c.id === editing.id ? { ...c, name: trimmed } : c)))
    } else {
      setCustomers((prev) => [...prev, { id: crypto.randomUUID(), name: trimmed }])
    }
    formHandlers.close()
  }

  const confirmDelete = () => {
    if (deleting) setCustomers((prev) => prev.filter((c) => c.id !== deleting.id))
    setDeleting(null)
  }

  const query = search.trim().toLowerCase()
  const visible = customers
    .filter((c) => c.name.toLowerCase().includes(query))
    .sort((a, b) => a.name.localeCompare(b.name))

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Title order={2}>Customers</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
          Add customer
        </Button>
      </Group>

      <TextInput
        placeholder="Search customers"
        aria-label="Search customers"
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        maw={400}
      />

      <Table verticalSpacing="sm" highlightOnHover withTableBorder>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th w={100} />
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {visible.length === 0 ? (
            <Table.Tr>
              <Table.Td colSpan={2}>
                <Text c="dimmed" ta="center" py="md">
                  {customers.length === 0 ? 'No customers yet' : 'No customers match your search'}
                </Text>
              </Table.Td>
            </Table.Tr>
          ) : (
            visible.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Tooltip label="Edit">
                      <ActionIcon variant="subtle" aria-label={`Edit ${c.name}`} onClick={() => openEdit(c)}>
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Tooltip>
                    <Tooltip label="Delete">
                      <ActionIcon variant="subtle" color="red" aria-label={`Delete ${c.name}`} onClick={() => setDeleting(c)}>
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))
          )}
        </Table.Tbody>
      </Table>

      <Modal opened={formOpened} onClose={formHandlers.close} title={editing ? 'Edit customer' : 'Add customer'}>
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <TextInput label="Name" data-autofocus {...form.getInputProps('name')} />
            <Group justify="flex-end">
              <Button variant="default" onClick={formHandlers.close}>
                Cancel
              </Button>
              <Button type="submit">{editing ? 'Save' : 'Add'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal opened={deleting !== null} onClose={() => setDeleting(null)} title="Delete customer">
        <Stack>
          <Text>
            Are you sure you want to delete <b>{deleting?.name}</b>? This cannot be undone.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDeleting(null)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  )
}
