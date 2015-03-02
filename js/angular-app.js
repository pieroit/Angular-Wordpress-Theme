var app = angular.module('wpAngularTheme', ['ngRoute', 'ngResource', 'ui.tinymce']);


// ROUTE CONFIGURATION
app.config(function($routeProvider){
	$routeProvider.when('/', {
		controller: ListCtrl,
		templateUrl: Directory.url+'/list.html'
	});
	$routeProvider.when('/view/:id', {
		controller: ViewCtrl,
		templateUrl: Directory.url+'/view.html'
	});
	$routeProvider.when('/page/:id', {
		controller: PageCtrl,
		templateUrl: Directory.url+'/page.html'
	});
	$routeProvider.when('/users/', {
		controller: UserCtrl,
		templateUrl: Directory.url+'/users.html'
	});
	$routeProvider.when('/users/:id', {
		controller: UserCtrl,
		templateUrl: Directory.url+'/users.html'
	});
});

// GLOBAL VARRIABLES
app.run(function($rootScope, $http){
	$rootScope.dir = Directory.url;
	$rootScope.site = Directory.site;
	$rootScope.SidebarURL = Directory.url+'/sidebar.html?v=4';
	$rootScope.tinymceOptions = {
		skin: 'lightgray',
		height: 300
	};
});

// FILTER FOR HTML
app.filter('to_trusted', ['$sce', function($sce){
    return function(text) {
        return $sce.trustAsHtml(text);
    };
}]);

// ANGULARJS FACTORIES
app.factory('Posts', function($http){
	var domain = '';
	return {
		'update': function($scope){
			$http.get(MyAjax.resturl+'/posts', $scope.data).then(function(response){
				$scope.posts = response.data;
			});	
		},
		'save': function(post){
			$http.put(MyAjax.resturl+'/posts', post).then(function(response){
				//$scope.posts = response.data;
			});	
		},
		'delete': function(postId){
			return $http.post(MyAjax.resturl+'/posts/delete_post', postId, {
				params: {
					nonce: token,
					id: postId
				}
			});
		}
	};
});

// ANGULARJS FACTORIES
app.factory('PostsNew', function($resource){
	return $resource(MyAjax.resturl+'/posts/:id?_wp_json_nonce='+wpApiOptions.nonce, {id: '@id'}, {
		update: {method: 'PUT'}
	});
});

app.factory('Comments', function($resource){
	return $resource(MyAjax.resturl+'/posts/:id/comments/', {id: '@id'}, {
		update: {method: 'PUT'}
	});
});

app.factory('Widgets', function($resource){
	return $resource(MyAjax.resturl+'/widgets/:id/', {id: '@id'});
});

app.factory('Users', function($resource){
	return $resource(MyAjax.resturl+'/users/:id/', {id: '@id'});
});


/** CONTROLLERS **/

// LIST CTRL ( FOR BLOG LISTING )
function ListCtrl($scope, $http, Posts, PostsNew){
	$scope.data = {};
	$scope.$root.openPost = false;
	
	// GET LATEST POSTS
	$scope.posts = PostsNew.query();
	
	// ADD NEW POST FUNCTION
	$scope.add = function(){
		$scope.$root.openPost = {
			'_wp_json_nonce' : wpApiOptions.nonce, 
			'title' : 'POST TITLE', 
			'content_raw' : 'POST CONTENT', 
			'newPost' : true, 
			'status' : 'publish'
		};
		setTimeout(function(){
			tinymce.activeEditor.setContent($scope.$root.openPost.content_raw);
		}, 100);
	};
    
  // EDIT POST (PUSH DATA TO FORM) FUNCTION
	$scope.edit = function(post){
		$scope.$root.openPost = post;
		$scope.$root.openPost.newPost = false;
		setTimeout(function(){
			tinymce.activeEditor.setContent($scope.$root.openPost.content);
		}, 100);
	};
  
    // DELETE POST FUNCTION
    $scope.delete = function(index, post){
		if(post.id){
			var deleteConf = confirm('Are you sure you want to delete '+post.title);
			if(deleteConf){
				$scope.posts.splice(index,1);
				PostsNew.delete({id:post.id});
			}
		}
	};
	// DATE FUNCTION
	$scope.datify = function(date){
		$scope.date = new Date(date);
		return $scope.date.getDate()+'/'+$scope.date.getMonth()+'/'+$scope.date.getYear();
	};
	
	// SAVE POST FUNCTION
	$scope.save = function(){	
		if($scope.$root.openPost.newPost){
			PostsNew.save($scope.$root.openPost, function(response){
				Posts.update($scope);
				$scope.$root.openPost = false;
				jQuery('#save').modal('hide');
			});
		} else {
			$scope.$root.openPost.id = $scope.$root.openPost.id;
			PostsNew.update($scope.$root.openPost, function(res){
				Posts.update($scope);
				$scope.$root.openPost = false;
				jQuery('#save').modal('hide');
			});
		}
    };
    // CLEAR FORM FUNCTION
    $scope.clear = function(){
		$scope.$root.openPost = false;
		jQuery('#save').modal('hide');
	};
}


// VIEW CTRL ( FOR SINGLE )
function ViewCtrl($scope, $http, $routeParams, Comments, PostsNew){
	
	// GET COMMENTS
	PostsNew.get({id:$routeParams.id}, function(res){
		$scope.ViewPost = res;
		$scope.ViewPost.comments = Comments.query({id:$routeParams.id});
	});
	
	
	$scope.openComment = {id: $routeParams.id, comment_post_ID:$routeParams.id};
	
	// SAVE NEW COMMENT
	$scope.savecomment = function(){
		Comments.save($scope.openComment, function(response){
			
			// CLEAR FORM
			jQuery('form#comment-form input[type="text"], form#comment-form input[type="email"], form#comment-form textarea').val('');
			
			// REFRESH COMMENTS
			$scope.ViewPost.comments = Comments.query({id:$routeParams.id});
			
			// RESET openComment
			$scope.openComment = {id: $routeParams.id, comment_post_ID:$routeParams.id};
			
			
		});
	};
}

// PAGE CTRL ( FOR PAGES )
function PageCtrl($scope, $http, $routeParams, Comments, PostsNew){
	
	// GET COMMENTS
	PostsNew.get({id:$routeParams.id}, function(res){
		$scope.ViewPost = res;
		$scope.ViewPost.comments = Comments.query({id:$routeParams.id});
		
	});
	
	
	$scope.openComment = {id: $routeParams.id, comment_post_ID:$routeParams.id};
	
	// SAVE NEW COMMENT
	$scope.savecomment = function(){
		Comments.save($scope.openComment, function(response){
			$scope.ViewPost.comments.push($scope.openComment);
			$scope.$root.openComment = {post: $routeParams.id};
			jQuery('form#comment-form input[type="text"], form#comment-form input[type="email"], form#comment-form textarea').val('');
		});
	};
}

// SIDEBAR CTRL ( FOR SIDEBAR )

function SidebarCtrl($scope, $http, $routeParams, Widgets){
	/*
Widgets.query({id:'1'}, function(resp){
		$scope.Widgets = resp;
	});
*/
}

// NAV CTRL ( FOR NAV )
function NavCtrl($scope, $http, Posts){
	
	// ORIGINAL CODE USING WP DEFAULT AJAX
	$http.post(MyAjax.ajaxurl, $scope.data, {
		params:{
			action: 'get_header_nav'
		}
	}).then(function(response){
		$scope.navs = response.data;
	});
	
	// USER LOGGED IN? - ALSO UTILIZING OLD WP AJAX CODE
	$http.post(MyAjax.ajaxurl, $scope.data, {
		params:{
			action: 'user_check'
		}
	}).then(function(response){
		$scope.$root.user = response.data;
	});
}

function UserCtrl($scope, $http, $routeParams, Users) {
	
	if(!$routeParams.id) {
		Users.query(function(response){
			$scope.Users = response;
		});
	} else {
		Users.get({id:$routeParams.id}, function(response){
			$scope.User = response.data;
		});
	}
	
	$scope.openUser = {user_nicename: 'TESTUSER', user_email: 'testUser@testusersawesome.com'};
	
	$scope.save = function(){
		Users.save($scope.openUser, function(resp){
			if(resp.user.errors){ $scope.err = resp.user.errors; return resp.user.errors; }
			$scope.newUser = resp.user;
			jQuery('from#newUser').hide();
			jQuery('p.newUserLink').show();
			
		});
	};
}