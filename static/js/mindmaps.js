let currentMindmap = null;
let mindmapEditor = null;

async function initMindmapEditor() {
    const container = document.getElementById('mindmapContainer');
    
    // Initialize MindElixir library
    const options = {
        container: 'mindmapContainer',
        editable: true,
        contextMenu: true,
        locale: 'en',
    };

    // Create a simple mind map editor using SVG and canvas
    mindmapEditor = {
        data: {},
        container: container,
        draw: function() {
            this.container.innerHTML = '';
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('width', '100%');
            svg.setAttribute('height', '100%');
            svg.setAttribute('style', 'border: 1px solid #eee;');

            if (Object.keys(this.data).length === 0) {
                this.data = { title: 'Central Idea', children: [] };
            }

            drawNode(svg, this.data, 400, 50);
            this.container.appendChild(svg);
        },
        setData: function(data) {
            this.data = data;
            this.draw();
        },
        getData: function() {
            return this.data;
        }
    };

    function drawNode(svg, node, x, y) {
        // Draw node circle
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '30');
        circle.setAttribute('fill', '#007bff');
        circle.setAttribute('stroke', '#0056b3');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);

        // Draw text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', y);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('dy', '0.3em');
        text.setAttribute('fill', 'white');
        text.setAttribute('font-size', '12');
        text.setAttribute('font-weight', 'bold');
        text.textContent = node.title || 'Node';
        svg.appendChild(text);

        // Draw children
        if (node.children && node.children.length > 0) {
            const angleStep = (Math.PI * 2) / node.children.length;
            node.children.forEach((child, i) => {
                const angle = angleStep * i;
                const childX = x + Math.cos(angle) * 150;
                const childY = y + Math.sin(angle) * 150;

                // Draw line
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x);
                line.setAttribute('y1', y);
                line.setAttribute('x2', childX);
                line.setAttribute('y2', childY);
                line.setAttribute('stroke', '#ddd');
                line.setAttribute('stroke-width', '1');
                svg.appendChild(line);

                drawNode(svg, child, childX, childY);
            });
        }
    }

    mindmapEditor.draw();
    loadMindmaps();
}

async function loadMindmaps() {
    try {
        const res = await fetch('/api/mindmaps');
        const json = await res.json();
        
        if (!json.mindmaps) {
            console.error('Failed to load mindmaps:', json);
            return;
        }

        const list = document.getElementById('mindmapList');
        list.innerHTML = '';

        json.mindmaps.forEach(mindmap => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span onclick="loadMindmap('${mindmap.id}')" style="flex: 1;">${escapeHtml(mindmap.title)}</span>
                <span class="delete-btn" onclick="deleteMindmap('${mindmap.id}', event)">×</span>
            `;
            li.id = `mindmap-${mindmap.id}`;
            li.onclick = () => loadMindmap(mindmap.id);
            list.appendChild(li);
        });
    } catch (err) {
        console.error('Error loading mindmaps:', err);
    }
}

async function loadMindmap(id) {
    try {
        const res = await fetch(`/api/mindmaps?id=${id}`);
        const json = await res.json();

        if (!json.mindmaps || json.mindmaps.length === 0) {
            console.error('Mindmap not found');
            return;
        }

        currentMindmap = json.mindmaps[0];
        document.getElementById('mindmapTitle').value = currentMindmap.title;

        const data = typeof currentMindmap.data === 'string' 
            ? JSON.parse(currentMindmap.data) 
            : currentMindmap.data;
        
        mindmapEditor.setData(data);

        // Mark as active
        document.querySelectorAll('#mindmapList li').forEach(li => li.classList.remove('active'));
        const listItem = document.getElementById(`mindmap-${id}`);
        if (listItem) listItem.classList.add('active');
    } catch (err) {
        console.error('Error loading mindmap:', err);
    }
}

async function newMindmap() {
    const title = prompt('Enter mindmap title:', 'New Mind Map');
    if (!title) return;

    try {
        const res = await fetch('/api/mindmaps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: title,
                data: { title: title, children: [] }
            })
        });

        if (!res.ok) {
            console.error('Failed to create mindmap');
            return;
        }

        const json = await res.json();
        currentMindmap = {
            id: json.id,
            title: title,
            data: JSON.stringify({ title: title, children: [] })
        };

        document.getElementById('mindmapTitle').value = title;
        mindmapEditor.setData({ title: title, children: [] });

        loadMindmaps();
    } catch (err) {
        console.error('Error creating mindmap:', err);
    }
}

async function saveMindmap() {
    if (!currentMindmap) {
        alert('Please create or load a mindmap first');
        return;
    }

    const title = document.getElementById('mindmapTitle').value.trim() || 'Untitled mindmap';
    const data = mindmapEditor.getData();

    try {
        const res = await fetch('/api/mindmaps', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentMindmap.id,
                title: title,
                data: data
            })
        });

        if (!res.ok) {
            console.error('Failed to save mindmap');
            return;
        }

        currentMindmap.title = title;
        alert('Mind map saved!');
        loadMindmaps();
    } catch (err) {
        console.error('Error saving mindmap:', err);
    }
}

async function deleteMindmap(id, event) {
    event.stopPropagation();

    if (!confirm('Delete this mind map?')) return;

    try {
        const res = await fetch(`/api/mindmaps?id=${id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            console.error('Failed to delete mindmap');
            return;
        }

        if (currentMindmap && currentMindmap.id === id) {
            currentMindmap = null;
            document.getElementById('mindmapTitle').value = '';
            mindmapEditor.setData({ title: 'Central Idea', children: [] });
        }

        loadMindmaps();
    } catch (err) {
        console.error('Error deleting mindmap:', err);
    }
}

function escapeHtml(text) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initMindmapEditor);
