// script.js
let windyAPI = null;
let gisMap = null;
let forestLayer = null;

document.addEventListener('DOMContentLoaded', function() {
    const tabs = document.querySelectorAll('nav ul li a');
    const tabContents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function(e) {
            e.preventDefault();
            
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            this.classList.add('active');
            const tabId = this.getAttribute('href').substring(1);
            document.getElementById(tabId).classList.add('active');

            if (tabId === 'weather' && !windyAPI) {
                initWindyMap();
            } else if (tabId === 'map' && !gisMap) {
                initGISMap();
            } else if (tabId === 'blog') {
                loadBlogPosts();
            }
        });
    });

    loadLatestPosts();
});

function initWindyMap() {
    const options = {
        key: '5EkjzdRjWciXxFKnBHg8o4Db1rGsuEVH',
        verbose: true,
        lat: 16.0,
        lon: 106.0,
        zoom: 5
    };

    windyInit(options, api => {
        windyAPI = api;
        const { map, store } = api;

        L.control.scale().addTo(map);
        addLegend(map);

        forestLayer = L.geoJSON(getForestBoundaries(), {
            style: {
                color: "#ff7800",
                weight: 5,
                opacity: 0.65
            }
        }).addTo(map);
    });
}

function initGISMap() {
    gisMap = L.map('gis-map').setView([16.0, 106.0], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(gisMap);

    const drawControl = new L.Control.Draw({
        draw: {
            polygon: true,
            polyline: false,
            rectangle: false,
            circle: false,
            marker: false,
            circlemarker: false
        }
    });
    gisMap.addControl(drawControl);

    gisMap.on('draw:created', function(e) {
        const layer = e.layer;
        const area = calculateArea(layer);
        layer.bindPopup(`Diện tích khu vực: ${(area / 1000000).toFixed(2)} km²`).openPopup();
        gisMap.addLayer(layer);
    });
}

function addLegend(map) {
    const legend = L.control({position: 'bottomright'});
    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.innerHTML = `
            <h4>Chú thích</h4>
            <div><span style="background: #ff7800"></span> Ranh giới rừng</div>
            <div><span style="background: #0000ff"></span> Sông, hồ</div>
            <div><span style="background: #00ff00"></span> Thảm thực vật</div>
        `;
        return div;
    };
    legend.addTo(map);
}

function changeOverlay(overlayType) {
    if (windyAPI) {
        windyAPI.store.set('overlay', overlayType);
    }
}

function toggleForestLayer() {
    if (windyAPI && forestLayer) {
        const map = windyAPI.map;
        if (map.hasLayer(forestLayer)) {
            map.removeLayer(forestLayer);
        } else {
            forestLayer.addTo(map);
        }
    }
}

function calculateArea(layer) {
    let area = 0;
    const latlngs = layer.getLatLngs()[0];
    for (let i = 0; i < latlngs.length; i++) {
        const p1 = latlngs[i];
        const p2 = latlngs[(i + 1) % latlngs.length];
        area += (p2.lng - p1.lng) * (2 + Math.sin(p1.lat * Math.PI / 180) + Math.sin(p2.lat * Math.PI / 180));
    }
    area = Math.abs(area * 6378137 * 6378137 / 2);
    return area;
}

function getForestBoundaries() {
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"name": "Rừng mẫu"},
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[[105.0, 15.0], [107.0, 15.0], [107.0, 17.0], [105.0, 17.0], [105.0, 15.0]]]
                }
            }
        ]
    };
}

function loadBlogPosts() {
    const blogId = 'YOUR_BLOG_ID';
    const apiKey = 'YOUR_API_KEY';
    const maxResults = 5;

    $.ajax({
        url: `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&maxResults=${maxResults}`,
        method: 'GET',
        success: function(response) {
            const posts = response.items;
            let html = '';
            posts.forEach(post => {
                html += `
                    <div class="blog-post">
                        <h2><a href="${post.url}" target="_blank">${post.title}</a></h2>
                        <p class="post-date">Đăng ngày: ${new Date(post.published).toLocaleDateString('vi-VN')}</p>
                        <div class="post-content">${post.content.substring(0, 200)}...</div>
                        <a href="${post.url}" target="_blank">Đọc tiếp</a>
                    </div>
                `;
            });
            $('#blog-container').html(html);
        },
        error: function(err) {
            console.error('Lỗi khi tải bài viết:', err);
            $('#blog-container').html('<p>Không thể tải bài viết. Vui lòng thử lại sau.</p>');
        }
    });
}

function loadLatestPosts() {
    const blogId = 'YOUR_BLOG_ID';
    const apiKey = 'YOUR_API_KEY';
    const maxResults = 3;

    $.ajax({
        url: `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts?key=${apiKey}&maxResults=${maxResults}`,
        method: 'GET',
        success: function(response) {
            const posts = response.items;
            let html = '';
            posts.forEach(post => {
                html += `<li><a href="${post.url}" target="_blank">${post.title}</a></li>`;
            });
            $('#latest-posts-list').html(html);
        },
        error: function(err) {
            console.error('Lỗi khi tải bài viết mới nhất:', err);
            $('#latest-posts-list').html('<li>Không thể tải bài viết.</li>');
        }
    });
}