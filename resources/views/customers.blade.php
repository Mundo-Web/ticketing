
<link rel="stylesheet" href="https://cdn.datatables.net/1.13.6/css/jquery.dataTables.min.css">



<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
<script>
    $(document).ready(function() {
        $('#customersTable').DataTable();
    });
</script>


<table id="customersTable" class="display w-full">
<table class="table-auto w-full border-collapse border border-gray-300">
    <thead>
        <tr>
            <th class="border border-gray-300 px-4 py-2">ID</th>
            <th class="border border-gray-300 px-4 py-2">Name</th>
            <th class="border border-gray-300 px-4 py-2">Email</th>
            <th class="border border-gray-300 px-4 py-2">Actions</th>
        </tr>
    </thead>
    <tbody>
        @foreach ($customers as $customer)
            <tr>
                <td class="border border-gray-300 px-4 py-2">{{ $customer->id }}</td>
                <td class="border border-gray-300 px-4 py-2">{{ $customer->name }}</td>
                <td class="border border-gray-300 px-4 py-2">{{ $customer->email }}</td>
                <td class="border border-gray-300 px-4 py-2">
                    <a href="{{ route('customers.show', $customer->id) }}" class="text-blue-500">View</a>
                    <a href="{{ route('customers.edit', $customer->id) }}" class="text-yellow-500 ml-2">Edit</a>
                    <form action="{{ route('customers.destroy', $customer->id) }}" method="POST" class="inline">
                        @csrf
                        @method('DELETE')
                        <button type="submit" class="text-red-500 ml-2" onclick="return confirm('Are you sure?')">Delete</button>
                    </form>
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

