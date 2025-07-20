// Define the AngularJS app module with ngRoute as a dependency
var app = angular.module('myApp', ['ngRoute']);

// Configure routing
app.config(['$routeProvider', function($routeProvider) {
    $routeProvider
        .when("/", {
            templateUrl: "home.html",
            controller: "HomeController"
        })
        .when("/about", {
            templateUrl: "about.html",
            controller: "AboutController"
        })
        .when("/contact", {
            templateUrl: "contact.html",
            controller: "ContactController"
        })
        .when("/mytuition", {
            templateUrl: "mytuition.html",
            controller: "MyTuitionController"
        })
        .when('/table', {
            templateUrl: 'table.html',
            controller: 'TableController'
        })
        .otherwise({
            redirectTo: "/"
        });
}]);

// Home Controller
app.controller('HomeController', ['$scope', '$http', function($scope, $http) {
    $scope.combinedData = []; // To hold combined data from userTuitions and contacts
    $scope.search = {}; // For search filters

    // Fetch combined details
    $scope.fetchCombinedDetails = function() {
        $http.get('/api/combinedDetails')
            .then(function(response) {
                console.log('Fetched combined data:', response.data);
                $scope.combinedData = response.data;
            })
            .catch(function(error) {
                console.error('Error fetching combined details:', error);
            });
    };

    // ✅ Define the customFilter function in HomeController itself
    $scope.customFilter = function(data) {
        // If no search fields are filled, show all
        if (!$scope.search.tuitionName && !$scope.search.city && !$scope.search.class) {
            return true;
        }

        let matchesTuitionName = true;
        let matchesCity = true;
        let matchesClass = true;

        if ($scope.search.tuitionName) {
            matchesTuitionName = data.tuitionName && data.tuitionName.toLowerCase().includes($scope.search.tuitionName.toLowerCase());
        }

        if ($scope.search.city) {
            matchesCity = data.city && data.city.toLowerCase().includes($scope.search.city.toLowerCase());
        }

        if ($scope.search.class) {
            matchesClass = false;
            if (data.tuitions && data.tuitions.length > 0) {
                matchesClass = data.tuitions.some(function(tuition) {
                    return tuition.class && tuition.class.toLowerCase().includes($scope.search.class.toLowerCase());
                });
            }
        }

        return matchesTuitionName && matchesCity && matchesClass;
    };

    // Fetch data on controller load
    $scope.fetchCombinedDetails();
}]);



app.service('TuitionService', ['$http', function($http) {
    this.getUserTuitions = function(tuitionName) {
        return $http.get('/api/userTuitions', { params: { tuitionName: tuitionName } });
    };

    this.deleteTuition = function(tuitionId) {
        return $http.delete(`/api/tuition/${tuitionId}`);
    };
}]);

// About Controller (for login)
app.controller('AboutController', function($scope, $http, $location) {
    $scope.tuitionName = "";
    $scope.password = "";
    $scope.errorMessage = "";

    $scope.login = function() {
        $http.post('/api/login', {
            tuitionName: $scope.tuitionName,
            password: $scope.password
        })
        .then(function(response) {
            $scope.loggedInTuitionName = $scope.tuitionName; 
            localStorage.setItem('loggedInTuitionName', $scope.tuitionName);
            $location.path('/mytuition');
        })
        .catch(function(error) {
            $scope.errorMessage = error.data.message || "An error occurred. Please try again.";
        });
    };
});

// My Tuition Controller
app.controller('MyTuitionController', ['$scope', '$http', '$location', 'TuitionService', function($scope, $http, $location, TuitionService) {
    $scope.tuitions = []; 
    $scope.userTuitions = [];
    $scope.storedTuitions = [];
    $scope.loggedInTuitionName = localStorage.getItem('loggedInTuitionName');

    // Add a new tuition entry
    $scope.addTuition = function() {
        $scope.tuitions.push({ class: '', subject: '', fees: '' });
    };

    // Remove a tuition entry by index
    $scope.removeTuition = function(index) {
        $scope.tuitions.splice(index, 1);
    };

    // Submit the tuition entries to the server
    $scope.submitTuition = function() {
        if ($scope.tuitions.length === 0) {
            alert("Please enter at least one tuition.");
            return;
        }

        $http.post('/api/tuition', { tuitionName: $scope.loggedInTuitionName, tuitions: $scope.tuitions })
            .then(function(response) {
                // Assuming the response contains the updated list of tuitions
                $scope.storedTuitions = response.data.tuitions; 
                $scope.tuitions = []; // Clear the input fields
                alert('Tuition added successfully!');
            })
            .catch(function(error) {
                console.error('Error adding tuition:', error);
                alert("Error: " + (error.data?.message || "Unknown error occurred."));
            });
    };

    // Fetch tuitions from the server
    $scope.fetchTuitions = function() {
        $http.get('/api/userTuitions', { params: { tuitionName: $scope.loggedInTuitionName } })
            .then(function(response) {
                console.log('Fetched tuitions:', response.data); // Log the response to check the structure
                $scope.userTuitions = []; // Initialize the userTuitions array
    
                // Loop through each entry and populate userTuitions array
                response.data.forEach(entry => {
                    if (entry.tuitions && entry.tuitions.length > 0) {
                        entry.tuitions.forEach(tuition => {
                            $scope.userTuitions.push({
                                class: tuition.class,
                                subject: tuition.subject,
                                fees: tuition.fees,
                                _id: tuition._id // Track the ID
                            });
                        });
                    }
                });
            })
            .catch(function(error) {
                console.error('Error fetching tuitions:', error);
            });

        $http.get('/api/tuitions') // Ensure this endpoint returns the tuition data
            .then(response => {
                $scope.tuitions = response.data; // Assign the fetched data to $scope.tuitions
            })
            .catch(error => {
                console.error("Error fetching tuitions:", error);
            });
    };
    
    // Inside your AngularJS controller
    $scope.tuitionId = "your_tuition_id_here";
    
    // Edit tuition function in AngularJS
    
    
    
$scope.deleteTuition = function(index) {
    const tuitionToDelete = $scope.userTuitions[index];
    const payload = {
        tuitionName: $scope.loggedInTuitionName,
        class: tuitionToDelete.class,
        subject: tuitionToDelete.subject,
        fees: tuitionToDelete.fees
    };

    console.log("🟠 Sending delete payload:", payload);

    $http.post('/api/deleteTuition', payload)
        .then(response => {
            console.log("✅ Delete success:", response.data);
            $scope.fetchTuitions();
        })
        .catch(error => {
            console.error("❌ Delete failed:", error);
        });
};



$scope.search = {};

$scope.filterCombined = function(item) {
  const tuitionMatch = !$scope.search.tuitionName || item.tuitionName.toLowerCase().includes($scope.search.tuitionName.toLowerCase());
  const cityMatch = !$scope.search.city || item.city.toLowerCase().includes($scope.search.city.toLowerCase());

  let classMatch = true;
  if ($scope.search.class) {
    classMatch = false;
    if (item.tuitions && item.tuitions.length > 0) {
      for (const t of item.tuitions) {
        if (t.class && t.class.toLowerCase().includes($scope.search.class.toLowerCase())) {
          classMatch = true;
          break;
        }
      }
    }
  }

  return tuitionMatch && cityMatch && classMatch;
};

 

  
   





    
     
    
    $scope.editTuition = function(tuition) {
    const updatedData = {
        class: tuition.class,
        subject: tuition.subject,
        fees: tuition.fees
    };

    $http.put('/api/tuitions', {
        tuitionName: $scope.loggedInTuitionName,
        class: tuition.class,
        updatedData: updatedData
    })
    .then(response => {
        console.log("Update Success:", response.data);
        $scope.fetchTuitions(); // Refresh the tuition list
    })
    .catch(error => {
        console.error("Update Error:", error);
    });
};

$scope.updateTuition = function(tuition) {
    const updatedData = {
        class: tuition.class,
        subject: tuition.subject,
        fees: tuition.fees
    };

    $http.put('/api/tuitions', {
        tuitionName: $scope.loggedInTuitionName,
        class: tuition.class,
        updatedData: updatedData
    })
    .then(response => {
        console.log("Update Success:", response.data);
        tuition.editMode = false; // Exit edit mode
        $scope.fetchTuitions();   // Refresh list
    })
    .catch(error => {
        console.error("Update Error:", error);
    });
};

    
    

    $scope.logout = function() {
        // Logic for logging out (e.g., clearing session)
        $location.path('/about'); // Redirect to about.html
    };

    // Fetch the initial list of tuitions when the controller loads
    $scope.fetchTuitions(); 
}]);



// Contact Controller
app.controller('ContactController', function($scope, $http) {
    $scope.submitForm = function() {
        const contactData = {
            tuitionName: $scope.tuitionName,
            tutorName: $scope.tutorName,
            phoneNumber: $scope.phoneNumber,
            password: $scope.password,
            address: $scope.address,
            city: $scope.city,
            state: $scope.state,
        };

        $http.post('/contact', contactData)
            .then(response => {
                alert('Contact details submitted successfully!');
            })
            .catch(error => {
                $scope.errorMessage = "An error occurred.";
            });
    };
});

// Table Controller
// Table Controller
app.controller('TableController', ['$scope', '$location', 'TuitionService', function($scope, $location, TuitionService) {
    // Load stored tuitions from local storage
    TuitionService.deleteTuition(tuition._id).then(function() {
        // Update the view
        $scope.storedTuitions = $scope.storedTuitions.filter(t => t._id !== tuition._id);
        localStorage.setItem('storedTuitions', JSON.stringify($scope.storedTuitions));
        alert("Tuition deleted successfully!");
    }).catch(function(error) {
        console.error('Error deleting tuition:', error);
        alert("Error deleting tuition: " + (error.data?.message || "Unknown error occurred."));
    });
    
    // Edit tuition function
    $scope.editTuition = function(tuition) {
        // Store the tuition to be edited in local storage
        localStorage.setItem('editTuition', JSON.stringify(tuition));
        // Redirect to the My Tuition page where the edit form is
        $location.path('/mytuition');
    };

    // Delete tuition function
    $scope.deleteTuition = function(tuition) {
        console.log('Attempting to delete tuition with ID:', tuition._id); // Log the ID for debugging
        if (confirm("Are you sure you want to delete this tuition?")) {
            TuitionService.deleteTuition(tuition._id).then(function() {
                // Filter out the deleted tuition from the storedTuitions array
                $scope.storedTuitions = $scope.storedTuitions.filter(t => t._id !== tuition._id);
                localStorage.setItem('storedTuitions', JSON.stringify($scope.storedTuitions));
                alert("Tuition deleted successfully!");
            }).catch(function(error) {
                console.error('Error deleting tuition:', error); // Log the error
                alert("Error deleting tuition: " + (error.data?.message || "Unknown error occurred."));
            });
        }
    };
    
    
}]);



