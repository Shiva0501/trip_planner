// DOM Elements
const createTripBtn = document.getElementById('createTripBtn');
const newTripModal = document.getElementById('newTripModal');
const closeBtns = document.querySelectorAll('.close');
const newTripForm = document.getElementById('newTripForm');
const tripsContainer = document.getElementById('tripsContainer');
const logoutBtn = document.getElementById('logoutBtn');
const startPlanningBtn = document.getElementById('startPlanningBtn');
const tripDetailModal = document.getElementById('tripDetailModal');
const tabBtns = document.querySelectorAll('.tab-btn');
const addTravelerBtn = document.getElementById('addTravelerBtn');
const addTravelerModal = document.getElementById('addTravelerModal');
const closeTravelerModal = document.querySelector('.close-traveler');
const addTravelerForm = document.getElementById('addTravelerForm');
const uploadPhotosBtn = document.getElementById('uploadPhotosBtn');
const photoUpload = document.getElementById('photoUpload');
const addNoteBtn = document.getElementById('addNoteBtn');

// Current trip data
let currentTrip = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.isLoggedIn) {
        if (!window.location.pathname.includes('signin.html')) {
            window.location.href = 'signin.html';
        }
    } else {
        // Update user info in sidebar
        updateUserInfo(currentUser);
        
        // Load trips from localStorage
        loadTrips();
        
        // Set current date as default for trip forms
        const today = new Date().toISOString().split('T')[0];
        const startDateInput = document.getElementById('startDate');
        const endDateInput = document.getElementById('endDate');
        if (startDateInput) startDateInput.value = today;
        if (endDateInput) {
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 7);
            endDateInput.value = nextWeek.toISOString().split('T')[0];
        }
    }
});

// Update user info in sidebar
function updateUserInfo(user) {
    const userNameEl = document.querySelector('.user-info .name');
    const avatarEl = document.querySelector('.user-profile .avatar');
    
    if (userNameEl && avatarEl) {
        userNameEl.textContent = user.firstName || user.email.split('@')[0];
        avatarEl.textContent = (user.firstName ? user.firstName[0] : user.email[0]).toUpperCase();
    }
}

// Event Listeners
if (createTripBtn) {
    createTripBtn.addEventListener('click', () => {
        newTripModal.style.display = 'block';
    });
}

if (startPlanningBtn) {
    startPlanningBtn.addEventListener('click', () => {
        newTripModal.style.display = 'block';
    });
}

// Close modals when clicking on X or outside
closeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        if (btn.closest('.modal') === newTripModal) {
            newTripModal.style.display = 'none';
        } else if (btn.closest('.modal') === tripDetailModal) {
            tripDetailModal.style.display = 'none';
        } else if (btn.closest('.modal') === addTravelerModal) {
            addTravelerModal.style.display = 'none';
        }
    });
});

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === newTripModal) {
        newTripModal.style.display = 'none';
    } else if (e.target === tripDetailModal) {
        tripDetailModal.style.display = 'none';
    } else if (e.target === addTravelerModal) {
        addTravelerModal.style.display = 'none';
    }
});

// Handle trip image preview
const tripImageInput = document.getElementById('tripImage');
const imagePreview = document.getElementById('imagePreview');

if (tripImageInput) {
    tripImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.innerHTML = `<img src="${event.target.result}" alt="Trip preview">`;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

// Handle traveler avatar preview
const travelerAvatarInput = document.getElementById('travelerAvatar');
const avatarPreview = document.getElementById('avatarPreview');

if (travelerAvatarInput) {
    travelerAvatarInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                avatarPreview.innerHTML = `<img src="${event.target.result}" alt="Avatar preview">`;
                avatarPreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });
}

// Create new trip
if (newTripForm) {
    newTripForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const tripName = document.getElementById('tripName').value;
        const destination = document.getElementById('destination').value;
        const tripType = document.getElementById('tripType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const description = document.getElementById('description').value;
        const tripImage = document.getElementById('tripImage').files[0];
        
        // Create trip object
        const trip = {
            id: Date.now().toString(),
            name: tripName,
            destination: destination,
            type: tripType,
            startDate: startDate,
            endDate: endDate,
            description: description,
            createdAt: new Date().toISOString(),
            travelers: [],
            photos: [],
            notes: [],
            itinerary: []
        };
        
        // Handle image
        if (tripImage) {
            const reader = new FileReader();
            reader.onload = function(event) {
                trip.image = event.target.result;
                saveTrip(trip);
                newTripModal.style.display = 'none';
                newTripForm.reset();
                imagePreview.style.display = 'none';
                imagePreview.innerHTML = '';
            };
            reader.readAsDataURL(tripImage);
        } else {
            // Default image based on trip type
            const defaultImages = {
                leisure: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                business: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                adventure: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                family: 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
                honeymoon: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80'
            };
            trip.image = defaultImages[tripType];
            saveTrip(trip);
            newTripModal.style.display = 'none';
            newTripForm.reset();
            imagePreview.style.display = 'none';
            imagePreview.innerHTML = '';
        }
        
        // Show success message
        alert(`Trip "${tripName}" created successfully!`);
    });
}

// Save trip to localStorage
function saveTrip(trip) {
    let trips = JSON.parse(localStorage.getItem('trips') || '[]');
    trips.push(trip);
    localStorage.setItem('trips', JSON.stringify(trips));
    loadTrips(); // Refresh the trips display
}

// Load trips from localStorage
function loadTrips() {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    if (trips.length === 0) {
        tripsContainer.innerHTML = `
            <div class="empty-state">
                <p>You don't have any upcoming trips yet.</p>
                <button class="btn-primary" id="startPlanningBtn">Start Planning</button>
            </div>
        `;
        
        // Add event listener to the new button
        const newStartBtn = document.getElementById('startPlanningBtn');
        if (newStartBtn) {
            newStartBtn.addEventListener('click', () => {
                newTripModal.style.display = 'block';
            });
        }
    } else {
        tripsContainer.innerHTML = '';
        trips.forEach(trip => {
            const tripCard = document.createElement('div');
            tripCard.className = 'trip-card';
            tripCard.innerHTML = `
                <div class="trip-cover" style="background-image: url('${trip.image}')"></div>
                <div class="trip-info">
                    <h3>${trip.name}</h3>
                    <p>${trip.destination}</p>
                    <p class="trip-dates">${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}</p>
                    <span class="trip-type ${trip.type}">${capitalizeFirstLetter(trip.type)}</span>
                </div>
            `;
            
            // Add click event to open trip details
            tripCard.addEventListener('click', () => {
                openTripDetail(trip);
            });
            
            tripsContainer.appendChild(tripCard);
        });
    }
}

// Format date for display
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Open trip detail modal
function openTripDetail(trip) {
    currentTrip = trip;
    
    // Update modal content
    document.getElementById('tripCoverImage').style.backgroundImage = `url('${trip.image}')`;
    document.getElementById('tripDetailName').textContent = trip.name;
    document.getElementById('tripDetailDestination').textContent = trip.destination;
    document.getElementById('tripDetailDates').textContent = `${formatDate(trip.startDate)} - ${formatDate(trip.endDate)}`;
    document.getElementById('tripDetailType').textContent = capitalizeFirstLetter(trip.type);
    
    // Show the modal
    tripDetailModal.style.display = 'block';
    
    // Load tab content
    loadItineraryTab(trip);
    loadTravelersTab(trip);
    loadPhotosTab(trip);
    loadNotesTab(trip);
}

// Load itinerary tab content
function loadItineraryTab(trip) {
    const itineraryDays = document.getElementById('itineraryDays');
    
    if (trip.itinerary && trip.itinerary.length > 0) {
        itineraryDays.innerHTML = '';
        
        trip.itinerary.forEach((day, index) => {
            const dayEl = document.createElement('div');
            dayEl.className = 'itinerary-day';
            dayEl.innerHTML = `
                <div class="day-header">
                    <span>Day ${index + 1}: ${formatDate(day.date)}</span>
                    <span>▼</span>
                </div>
                <div class="day-content">
                    <div class="activities-list">
                        ${day.activities.map(activity => `
                            <div class="activity-item-card">
                                <div class="activity-time">${activity.time}</div>
                                <div class="activity-details">
                                    <div>${activity.title}</div>
                                    <div style="color: #666; font-size: 14px;">${activity.location || ''}</div>
                                </div>
                                <div class="activity-actions">
                                    <button class="add-activity-btn">Edit</button>
                                    <button class="add-activity-btn">Delete</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="add-activity-btn" style="margin-top: 10px;">+ Add Activity</button>
                </div>
            `;
            
            // Add toggle functionality
            const header = dayEl.querySelector('.day-header');
            header.addEventListener('click', () => {
                const content = dayEl.querySelector('.day-content');
                content.classList.toggle('active');
                const arrow = header.querySelector('span:last-child');
                arrow.textContent = content.classList.contains('active') ? '▲' : '▼';
            });
            
            itineraryDays.appendChild(dayEl);
        });
    } else {
        itineraryDays.innerHTML = `
            <div class="empty-state">
                <p>No itinerary days added yet.</p>
                <button class="btn-primary" id="addFirstDayBtn">Add First Day</button>
            </div>
        `;
        
        // Add event listener
        document.getElementById('addFirstDayBtn').addEventListener('click', () => {
            addItineraryDay();
        });
    }
}

// Add a new day to the itinerary
function addItineraryDay() {
    if (!currentTrip) return;
    
    const newDay = {
        date: currentTrip.startDate, // Default to trip start date
        activities: []
    };
    
    // In a real app, we would update the trip in the database
    // For this demo, we'll just show a prompt
    const date = prompt('Enter date for the new day (YYYY-MM-DD):', currentTrip.startDate);
    if (date) {
        newDay.date = date;
        alert('New day added! In a real app, this would be saved to the database.');
        // Update currentTrip and reload the tab
        if (!currentTrip.itinerary) currentTrip.itinerary = [];
        currentTrip.itinerary.push(newDay);
        loadItineraryTab(currentTrip);
    }
}

// Load travelers tab content
function loadTravelersTab(trip) {
    const travelersList = document.getElementById('travelersList');
    
    // Add current user as primary traveler if not already added
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (trip.travelers.length === 0 && currentUser) {
        trip.travelers.push({
            id: 'user-' + Date.now(),
            name: currentUser.firstName || currentUser.email.split('@')[0],
            email: currentUser.email,
            role: 'primary',
            avatar: '' // Could set a default avatar
        });
    }
    
    if (trip.travelers.length > 0) {
        travelersList.innerHTML = '';
        
        trip.travelers.forEach(traveler => {
            const travelerEl = document.createElement('div');
            travelerEl.className = 'traveler-item';
            travelerEl.innerHTML = `
                <div class="traveler-avatar" style="background-color: ${getAvatarColor(traveler.name)}">
                    ${traveler.name.charAt(0).toUpperCase()}
                </div>
                <div class="traveler-info">
                    <h4>${traveler.name}</h4>
                    <p>${capitalizeFirstLetter(traveler.role)}</p>
                </div>
            `;
            travelersList.appendChild(travelerEl);
        });
    } else {
        travelersList.innerHTML = `
            <div class="empty-state">
                <p>No travelers added yet.</p>
                <button class="btn-primary" id="addFirstTravelerBtn">Add First Traveler</button>
            </div>
        `;
    }
}

// Generate a color for avatar based on name
function getAvatarColor(name) {
    const colors = ['#4a6bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8', '#6f42c1', '#e83e8c'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
}

// Add traveler button event
if (addTravelerBtn) {
    addTravelerBtn.addEventListener('click', () => {
        addTravelerModal.style.display = 'block';
    });
}

// Close traveler modal
if (closeTravelerModal) {
    closeTravelerModal.addEventListener('click', () => {
        addTravelerModal.style.display = 'none';
    });
}

// Add traveler form submission
if (addTravelerForm) {
    addTravelerForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('travelerName').value;
        const email = document.getElementById('travelerEmail').value;
        const role = document.getElementById('travelerRole').value;
        const avatarFile = document.getElementById('travelerAvatar').files[0];
        
        // Create traveler object
        const traveler = {
            id: Date.now().toString(),
            name: name,
            email: email,
            role: role
        };
        
        // Handle avatar
        if (avatarFile) {
            const reader = new FileReader();
            reader.onload = function(event) {
                traveler.avatar = event.target.result;
                // In a real app, we would save this to the trip
                alert(`Traveler "${name}" added successfully!`);
                addTravelerModal.style.display = 'none';
                addTravelerForm.reset();
                avatarPreview.style.display = 'none';
                avatarPreview.innerHTML = '';
                
                // Refresh travelers list
                if (currentTrip) {
                    if (!currentTrip.travelers) currentTrip.travelers = [];
                    currentTrip.travelers.push(traveler);
                    loadTravelersTab(currentTrip);
                }
            };
            reader.readAsDataURL(avatarFile);
        } else {
            traveler.avatar = '';
            alert(`Traveler "${name}" added successfully!`);
            addTravelerModal.style.display = 'none';
            addTravelerForm.reset();
            avatarPreview.style.display = 'none';
            avatarPreview.innerHTML = '';
            
            // Refresh travelers list
            if (currentTrip) {
                if (!currentTrip.travelers) currentTrip.travelers = [];
                currentTrip.travelers.push(traveler);
                loadTravelersTab(currentTrip);
            }
        }
    });
}

// Load photos tab content
function loadPhotosTab(trip) {
    const photosGrid = document.getElementById('photosGrid');
    
    if (trip.photos && trip.photos.length > 0) {
        photosGrid.innerHTML = '';
        
        trip.photos.forEach(photo => {
            const photoEl = document.createElement('div');
            photoEl.className = 'photo-item';
            photoEl.innerHTML = `
                <img src="${photo.url}" alt="${photo.caption || 'Trip photo'}">
                <div class="photo-delete">✕</div>
            `;
            
            // Add delete functionality
            const deleteBtn = photoEl.querySelector('.photo-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this photo?')) {
                    // In a real app, we would remove from database
                    alert('Photo deleted! In a real app, this would be removed from the database.');
                }
            });
            
            photosGrid.appendChild(photoEl);
        });
    } else {
        photosGrid.innerHTML = `
            <div class="empty-state">
                <p>No photos added yet.</p>
                <button class="btn-primary" id="uploadFirstPhotoBtn">Upload First Photo</button>
            </div>
        `;
    }
}

// Upload photos button event
if (uploadPhotosBtn) {
    uploadPhotosBtn.addEventListener('click', () => {
        photoUpload.click();
    });
}

// Handle photo upload
if (photoUpload) {
    photoUpload.addEventListener('change', function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            // In a real app, we would upload these files to a server
            // For this demo, we'll just show an alert
            alert(`${files.length} photo(s) uploaded successfully! In a real app, these would be saved to the database.`);
            
            // Clear the input
            photoUpload.value = '';
            
            // Refresh the photos tab
            if (currentTrip) {
                loadPhotosTab(currentTrip);
            }
        }
    });
}

// Load notes tab content
function loadNotesTab(trip) {
    const notesList = document.getElementById('notesList');
    
    if (trip.notes && trip.notes.length > 0) {
        notesList.innerHTML = '';
        
        trip.notes.forEach(note => {
            const noteEl = document.createElement('div');
            noteEl.className = 'note-card';
            noteEl.innerHTML = `
                <div class="note-header">
                    <div class="note-title">${note.title}</div>
                    <div class="note-date">${formatDate(note.createdAt)}</div>
                </div>
                <div class="note-content">${note.content}</div>
                <div class="note-actions">
                    <button class="note-action-btn">✎</button>
                    <button class="note-action-btn delete-btn">✕</button>
                </div>
            `;
            
            // Add delete functionality
            const deleteBtn = noteEl.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete this note?')) {
                    // In a real app, we would remove from database
                    alert('Note deleted! In a real app, this would be removed from the database.');
                }
            });
            
            notesList.appendChild(noteEl);
        });
    } else {
        notesList.innerHTML = `
            <div class="empty-state">
                <p>No notes added yet.</p>
                <button class="btn-primary" id="addFirstNoteBtn">Add First Note</button>
            </div>
        `;
    }
}

// Add note button event
if (addNoteBtn) {
    addNoteBtn.addEventListener('click', () => {
        const title = prompt('Enter note title:');
        if (title) {
            const content = prompt('Enter note content:');
            if (content) {
                // Create note object
                const note = {
                    id: Date.now().toString(),
                    title: title,
                    content: content,
                    createdAt: new Date().toISOString()
                };
                
                // In a real app, we would save this to the trip
                alert(`Note "${title}" added successfully!`);
                
                // Refresh notes list
                if (currentTrip) {
                    if (!currentTrip.notes) currentTrip.notes = [];
                    currentTrip.notes.push(note);
                    loadNotesTab(currentTrip);
                }
            }
        }
    });
}

// Tab navigation
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        tabBtns.forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        // Add active class to clicked button
        btn.classList.add('active');
        
        // Show corresponding pane
        const tabId = btn.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

// Logout functionality
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
            // Clear user session
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (currentUser) {
                currentUser.isLoggedIn = false;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
            }
            
            // Redirect to sign in page
            window.location.href = 'signin.html';
        }
    });
}

// Add event listener for "Add Day" button
document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'addDayBtn') {
        addItineraryDay();
    }
});