let currentMindmap = null;
let mindmapEditor = null;
let selectedNode = null;

async function initMindmapEditor() {
    const canvas = document.getElementById('mindmapCanvas');
    const ctx = canvas.getContext('2d');

    mindmapEditor = {
        data: { id: 'root', title: 'Central Idea', x: 450, y: 80, children: [] },
        canvas: canvas,
        ctx: ctx,
        nodes: [],
        
        draw: function() {
            // Clear canvas
            this.ctx.fillStyle = '#fafafa';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.nodes = [];
            this.drawNode(this.data);
        },

        drawNode: function(node) {
            if (!node.x) node.x = 450;
            if (!node.y) node.y = 80;

            const nodeObj = { 
                id: node.id, 
                x: node.x, 
                y: node.y, 
                title: node.title, 
                width: 100,
                height: 45
            };
            this.nodes.push(nodeObj);

            // Draw connections first
            if (node.children && node.children.length > 0) {
                node.children.forEach((child, i) => {
                    const angle = (Math.PI * 2 / Math.max(node.children.length, 2)) * i - Math.PI / 2;
                    const distance = 180;
                    child.x = node.x + Math.cos(angle) * distance;
                    child.y = node.y + Math.sin(angle) * distance;

                    // Draw curved line
                    this.ctx.strokeStyle = '#bbb';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(node.x, node.y);
                    const cp1x = (node.x + child.x) / 2;
                    const cp1y = node.y + 30;
                    const cp2x = (node.x + child.x) / 2;
                    const cp2y = child.y - 30;
                    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, child.x, child.y);
                    this.ctx.stroke();

                    this.drawNode(child);
                });
            }

            // Draw node box
            const isRoot = node.id === 'root';
            const isSelected = selectedNode && selectedNode.id === node.id;

            this.ctx.fillStyle = isRoot ? '#007bff' : '#6c757d';
            if (isSelected) {
                this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = '#0056b3';
            }

            this.ctx.fillRect(
                node.x - nodeObj.width / 2,
                node.y - nodeObj.height / 2,
                nodeObj.width,
                nodeObj.height
            );
            this.ctx.shadowColor = 'transparent';

            // Draw border
            this.ctx.strokeStyle = isSelected ? '#002a5c' : '#004085';
            this.ctx.lineWidth = isSelected ? 3 : 2;
            this.ctx.strokeRect(
                node.x - nodeObj.width / 2,
                node.y - nodeObj.height / 2,
                nodeObj.width,
                nodeObj.height
            );

            // Draw text
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            const text = (node.title || 'Node').substring(0, 12);
            this.ctx.fillText(text, node.x, node.y);
        },

        getData: function() {
            return this.data;
        },

        setData: function(data) {
            this.data = data;
            if (!this.data.id) this.data.id = 'root';
            if (!this.data.x) this.data.x = 450;
            if (!this.data.y) this.data.y = 80;
            this.draw();
        }
    };

    // Canvas interactions
    canvas.addEventListener('click', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let node of mindmapEditor.nodes) {
            if (x >= node.x - node.width / 2 && x <= node.x + node.width / 2 &&
                y >= node.y - node.height / 2 && y <= node.y + node.height / 2) {
                selectedNode = node;
                mindmapEditor.draw();
                return;
            }
        }
        selectedNode = null;
        mindmapEditor.draw();
    });

    canvas.addEventListener('dblclick', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        for (let node of mindmapEditor.nodes) {
            if (x >= node.x - node.width / 2 && x <= node.x + node.width / 2 &&
                y >= node.y - node.height / 2 && y <= node.y + node.height / 2) {
                editNode(node);
                return;
            }
        }
    });

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
            li.id = `mindmap-${mindmap.id}`;
            li.textContent = mindmap.title;
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
                data: { id: 'root', title: title, x: 450, y: 80, children: [] }
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
            data: { id: 'root', title: title, x: 450, y: 80, children: [] }
        };

        document.getElementById('mindmapTitle').value = title;
        mindmapEditor.setData(currentMindmap.data);

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
        mindmapEditor.setData({ id: 'root', title: 'Central Idea', x: 450, y: 80, children: [] });
        loadMindmaps();
    } catch (err) {
        console.error('Error deleting mindmap:', err);
    }
}

function findNodeById(dataNode, id) {
    if (dataNode.id === id) return dataNode;
    if (!dataNode.children) return null;
    for (let child of dataNode.children) {
        const found = findNodeById(child, id);
        if (found) return found;
    }
    return null;
}

function removeNodeById(dataNode, id) {
    if (!dataNode.children) return false;
    const index = dataNode.children.findIndex((child) => child.id === id);
    if (index >= 0) {
        dataNode.children.splice(index, 1);
        return true;
    }
    for (let child of dataNode.children) {
        if (removeNodeById(child, id)) return true;
    }
    return false;
}

function addChildNode() {
    const selectedId = selectedNode?.id || 'root';
    const target = findNodeById(mindmapEditor.data, selectedId);
    if (!target) return;

    const title = prompt('Enter a new subtopic title:', 'New topic');
    if (!title) return;

    target.children = target.children || [];
    target.children.push({
        id: `${selectedId}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        title: title.substring(0, 30),
        x: target.x + 180,
        y: target.y + 0,
        children: []
    });

    mindmapEditor.draw();
}

function renameSelectedNode() {
    if (!selectedNode) {
        alert('Select a topic first to rename it.');
        return;
    }

    const newTitle = prompt('Rename topic:', selectedNode.title);
    if (newTitle === null) return;
    const node = findNodeById(mindmapEditor.data, selectedNode.id);
    if (!node) return;
    node.title = newTitle.substring(0, 30);
    mindmapEditor.draw();
}

function deleteSelectedNode() {
    if (!selectedNode || selectedNode.id === 'root') {
        alert('Select a non-root topic to delete.');
        return;
    }

    if (!confirm('Delete the selected topic?')) return;
    if (removeNodeById(mindmapEditor.data, selectedNode.id)) {
        selectedNode = null;
        mindmapEditor.draw();
    }
}

function editNode(node) {
    if (node.id === 'root') {
        const newTitle = prompt('Edit central idea:', node.title);
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
    } else {
        const newTitle = prompt('Edit topic:', node.title);
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
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initMindmapEditor);
