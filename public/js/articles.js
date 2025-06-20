// Function to update URL parameters without reloading the page
function updateURLParams(params) {
    const url = new URL(window.location.href);
    Object.keys(params).forEach(key => {
        if (params[key]) {
            url.searchParams.set(key, params[key]);
        } else {
            url.searchParams.delete(key);
        }
    });
    window.history.pushState({}, '', url);
}

// Function to update the articles table
async function updateArticlesTable() {
    try {
        // Get current filter values
        const search = document.getElementById('searchInput').value;
        const category = document.getElementById('categoryFilter').value;
        const status = document.getElementById('statusFilter').value;
        
        // Update URL
        updateURLParams({ search, category, status });
        
        // Show loading state
        const tableBody = document.querySelector('table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center">
                    <div class="flex justify-center">
                        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                </td>
            </tr>
        `;
        
        // Fetch filtered results
        const response = await fetch(`/dashboard/articles?${new URLSearchParams({
            search,
            category,
            status
        })}`);
        
        if (!response.ok) throw new Error('Failed to fetch articles');
        
        const html = await response.text();
        
        // Create a temporary element to parse the HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Extract the new table body content
        const newTableBody = temp.querySelector('table tbody');
        if (newTableBody) {
            tableBody.innerHTML = newTableBody.innerHTML;
        }
        
        // Update pagination if it exists
        const pagination = temp.querySelector('.sm\\:flex-1.sm\\:flex.sm\\:items-center.sm\\:justify-between');
        const currentPagination = document.querySelector('.sm\\:flex-1.sm\\:flex.sm\\:items-center.sm\\:justify-between');
        if (pagination && currentPagination) {
            currentPagination.innerHTML = pagination.innerHTML;
        }
        
        // Update search info
        const searchInfo = temp.querySelector('#searchInfo');
        const currentSearchInfo = document.getElementById('searchInfo');
        if (searchInfo && currentSearchInfo) {
            currentSearchInfo.innerHTML = searchInfo.innerHTML;
            currentSearchInfo.style.display = (search || category || status) ? 'block' : 'none';
        }
        
        // Show/hide clear filters button
        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.style.display = (search || category || status) ? 'block' : 'none';
        }
        
        // Reattach event listeners to new elements
        attachEventListeners();
        
    } catch (error) {
        console.error('Error updating articles:', error);
        // Show error message
        const tableBody = document.querySelector('table tbody');
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                    <i class="fas fa-exclamation-circle mr-2"></i>
                    Failed to load articles. Please try again.
                </td>
            </tr>
        `;
    }
}

// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Debounced version of updateArticlesTable for search input
const debouncedUpdate = debounce(() => updateArticlesTable(), 300);

// Function to clear all filters
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('categoryFilter').value = '';
    document.getElementById('statusFilter').value = '';
    updateArticlesTable();
}

// Function to attach event listeners
function attachEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', debouncedUpdate);
    }
    
    // Category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', updateArticlesTable);
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', updateArticlesTable);
    }
    
    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearFilters);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    attachEventListeners();
});

// Function to confirm deletion of an article
function confirmDelete(articleId) {
    Swal.fire({
        title: 'Are you sure?',
        text: "This action cannot be undone!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            // Create a form and submit POST request to delete article
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = `/dashboard/articles/${articleId}/delete`;
            document.body.appendChild(form);
            form.submit();
        }
    });
}
