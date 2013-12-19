var demoApp = angular.module('demoApp', ['ngRoute']);

demoApp.config(function($routeProvider) {
	$routeProvider.when('/connect', {
		templateUrl: 'partials/connect.html',
		controller: 'connectCtrl'
	}).when('/editor', {
		templateUrl: 'partials/editor.html',
		controller: 'editorCtrl'
	}).otherwise({
		redirectTo: '/connect'
	});
});


demoApp.controller('connectCtrl', function connectCtrl($scope, $rootScope, $location) {
	OAuth.initialize("~~~[[YOUR_OAUTH_IO_PUBLIC_KEY]]~~~");

	function createDriveFile(title, callback) {
		$rootScope.drive.post({
			url: "/drive/v2/files",
			data: JSON.stringify({
				title: title,
				mimeType: 'application/vnd.google-apps.document'}),
			contentType: 'application/json'
		}).done(function(item) {
			callback(item);
		});
	}

	function getDriveFile(title, callback) {
		$rootScope.drive.get({
			url: "/drive/v2/files",
			data: {q: "title = '" + title + "'"}
		}).done(function(files) {
			if (files.items.length)
				return callback(files.items[0]);

			// create file if it does not exists
			createDriveFile(title, callback);
		});
	}

	$scope.connect = function() {
		OAuth.popup("google_drive", function(err, res) {
			if (err) return alert(err);
			$rootScope.drive = res;
			getDriveFile("realtime_test", function (file) {
				$rootScope.drive_file = file;
				$location.path('/editor');
				$scope.$apply();
			});
		});
	}
});

demoApp.controller('editorCtrl', function editorCtrl($scope, $rootScope) {
	$rootScope.drive.get($rootScope.drive_file.exportLinks['text/plain']).done(function(data) {
		$scope.file_content = data;
		$scope.$apply();

		$scope.$watch("file_content", function() {
			$scope.must_save = true;
			updateFile();
		});
	});

	function updateFile() {
		if ( ! $scope.must_save) return;
		if ($scope.saving) return setTimeout(updateFile, 50);

		$scope.saving = true;
		$scope.must_save = false;
		$rootScope.drive.put({
			url: "/upload/drive/v2/files/"
				+ $rootScope.drive_file.id
				+ "?uploadType=media",
			data: $scope.file_content
		}).always(function() {
			$scope.saving = false;
			updateFile();
		});
	}
});