let currentMindmap = null;
let mindmapEditor = null;
let selectedNode = null;
let panX = 0;
let panY = 0;
let zoom = 1;

async function initMindmapEditor() {
    const canvas = document.getElementById('mindmapCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        redraw();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    mindmapEditor = {
        data: { id: 'root', title: 'Central Idea', children: [] },
        canvas: canvas,
        ctx: ctx,
        nodes: [],
        
        draw: function() {
            this.ctx.fillStyle = '#fafafa';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.save();
            this.ctx.translate(panX, panY);
            this.ctx.scale(zoom, zoom);

            this.nodes = [];
            this.drawNode(this.data, this.canvas.width / 2 / zoom - panX / zoom, 80);

            this.ctx.restore();
        },

        drawNode: function(node, x, y) {
            const nodeObj = { id: node.id, x, y, title: node.title, radius: 45 };
            this.nodes.push(nodeObj);

            // Draw connections first (behind nodes)
            if (node.children && node.children.length > 0) {
                node.children.forEach((child, i) => {
                    const angle = (Math.PI * 2 / node.children.length) * i - Math.PI / 2;
                    const childX = x + Math.cos(angle) * 200;
                    const childY = y + Math.sin(angle) * 200;

                    // Draw curved connector
                    this.ctx.strokeStyle = '#ccc';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, y);
                    const controlX = (x + childX) / 2;
                    const controlY = (y + childY) / 2 + 50;
                    this.ctx.quadraticCurveTo(controlX, controlY, childX, childY);
                    this.ctx.stroke();

                    this.drawNode(child, childX, childY);
                });
            }

            // Draw node box
            const boxWidth = 100;
            const boxHeight = 50;
            const isRoot = node.id === 'root';
            const isSelected = selectedNode && selectedNode.id === node.id;

            this.ctx.fillStyle = isRoot ? '#007bff' : '#6c757d';
            if (isSelected) {
                this.ctx.fillStyle = '#0056b3';
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                this.ctx.shadowBlur = 10;
            }

            this.ctx.fillRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);
            this.ctx.shadowColor = 'transparent';

            // Draw border
            this.ctx.strokeStyle = isSelected ? '#002a5c' : '#004085';
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.strokeRect(x - boxWidth / 2, y - boxHeight / 2, boxWidth, boxHeight);

            // Draw text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 13px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const text = node.title.substring(0, 12);
            this.ctx.fillText(text, x, y - 5);

            // Draw add button
            if (isSelected) {
                this.ctx.fillStyle = '#28a745';
                this.ctx.beginPath();
                this.ctx.arc(x + boxWidth / 2 + 15, y - boxHeight / 2 - 15, 12, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = 'white';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText('+', x + boxWidth / 2 + 15, y - boxHeight / 2 - 15);
            }

            nodeObj.boxWidth = boxWidth;
            nodeObj.boxHeight = boxHeight;
        },

        getData: function() {
            return this.data;
        },

        setData: function(data) {
            this.data = data;
            this.draw();
        }
    };

    function redraw() {
        mindmapEditor.draw();
    }

    // Canvas interactions
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoom;
        const y = (e.clientY - rect.top - panY) / zoom;

        for (let node of mindmapEditor.nodes) {
            if (Math.abs(x - node.x) < node.radius && Math.abs(y - node.y) < node.radius) {
                selectedNode = node;

                // Check if add button clicked
                if (node.x + node.boxWidth / 2 + 15 - x < 15 && node.y - node.boxHeight / 2 - 15 - y < 15) {
                    addChildNode(node);
                    redraw();
                    return;
                }

                // Double click to edit
                if (e.detail === 2) {
                    editNode(node);
                }
                redraw();
                return;
            }
        }
        selectedNode = null;
        redraw();
    });

    canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - panX) / zoom;
        const y = (e.clientY - rect.top - panY) / zoom;

        for (let node of mindmapEditor.nodes) {
            if (Math.abs(x - node.x) < node.radius && Math.abs(y - node.y) < node.radius) {
                editNode(node);
                return;
            }
        }
    });

    loadMindmaps();
}

function addChildNode(parentNode) {
    function findNodeInData(node, targetId) {
        if (node.id === targetId) return node;
        if (node.children) {
            for (let child of node.children) {
                const found = findNodeInData(child, targetId);
                if (found) return found;
            }
        }
        return null;
    }

    const parent = findNodeInData(mindmapEditor.data, parentNode.id);
    if (!parent) return;

    const newNode = {
        id: 'node-' + Date.now(),
        title: 'New Topic',
        children: []
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newNode);

    selectedNode = { id: newNode.id };
    editNode(selectedNode);
}

function editNode(node) {
    const newTitle = prompt('Edit topic:', node.title || '');
    if (newTitle !== null) {
        function updateNodeInData(dataNode, targetId) {
            if (dataNode.id === targetId) {
                dataNode.title = newTitle.substring(0, 30);
                return true;
            }
            if (dataNode.children) {
                for (let child of dataNode.children) {
                    if (updateNodeInData(child, targetId)) return true;
                }
            }
            return false;
        }
        updateNodeInData(mindmapEditor.data, node.id);
        mindmapEditor.draw();
    }
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
        
        // Ensure data has required structure
        if (!data.id) data.id = 'root';
        if (!data.children) data.children = [];
        
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
                data: { id: 'root', title: title, children: [] }
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
            data: JSON.stringify({ id: 'root', title: title, children: [] })
        };

        document.getElementById('mindmapTitle').value = title;
        mindmapEditor.setData({ id: 'root', title: title, children: [] });

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

async function deleteCurrent() {
    if (!currentMindmap) {
        alert('Please load a mindmap first');
        return;
    }

    if (!confirm('Delete this mind map?')) return;

    try {
        const res = await fetch(`/api/mindmaps?id=${currentMindmap.id}`, {
            method: 'DELETE'
        });

        if (!res.ok) {
            console.error('Failed to delete mindmap');
            return;
        }

        currentMindmap = null;
        document.getElementById('mindmapTitle').value = '';
        mindmapEditor.setData({ id: 'root', title: 'Central Idea', children: [] });
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
