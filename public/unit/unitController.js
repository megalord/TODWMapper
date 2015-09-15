angular.module('newApp')
.controller('lessonItems', function(remoteUnit, remoteCourses, remoteTags, lessonPlanItems, $modal, $q, $scope, $routeParams){

  $scope.radioModel = 'SubHeader';

  function makePageMap(headers) {
    var pageObjs = {};
    var pageArr = headers.split(',').map(function(str) {
      return str.match(/page=(\d+).*rel="(\w+)/);
    });
    pageArr.forEach(function(pageMatchs) {
      pageObjs[pageMatchs[2]] = pageMatchs[1];
    });

    return pageObjs;
  }

  function createIntArray(count) {
    var array = [];
    for (var i = 0; i < count; i++) {
      array[i] = i+1;
    };
    return array;
  }

  function countItemTypes(lessonItems) {
    $scope.numLessons = 0;
    $scope.numContentItems = 0;
    $scope.numQuizes = 0;
    $scope.numAssignments = 0;
    $scope.numDiscussions = 0;

    for(var i = 0; i < lessonItems.length; i++) {
      var type = lessonItems[i].type;
      if(type === 'SubHeader')
        $scope.numLessons++;
      else if(type === 'Page' || 
              type === 'File' ||
                type === 'External')
        $scope.numContentItems++;
      else if(type === 'Assignment')
        $scope.numAssignments++;
      else if(type === 'Quiz')
        $scope.numQuizes++;
      else if(type === 'Discussion')
        $scope.numDiscussions++;
    }
  }

  $scope.toggleDropZones = function (isShown) {
    $scope.showDropZones = isShown;
  };

  $scope.onDrop = function (tag, activity) {
    var newTag = utils.pick(tag, ['courseId', 'unitId', 'content']);
    newTag.activityId = activity.id;
    newTag.activityType = activity.type;
    if (!utils.find($scope.tags, newTag)) {
      remoteTags.create(newTag).then(function (response) {
        $scope.tags.push(response.data);
      });
    }
  };

  $scope.deleteTag = function (tag) {
    remoteTags.id(tag._id).delete().then(function () {
      $scope.tags.splice($scope.tags.indexOf(tag), 1);
    });
  };

  $scope.deleteTagsByContent = function (content) {
    var tagsToDelete = $scope.tags.filter(function (tag) {
      return tag.content === content;
    });

    $modal.open({
      templateUrl: 'unit/confirmTagDeletion.html',
      controller: function ($scope) {
        $scope.content = content;
        $scope.numTags = tagsToDelete.length - 1;
      },
      size: 'sm'
    }).result.then(function () {
      return tagsToDelete.map($scope.deleteTag);
    });
  };

  $scope.open = function (pageUrl) {

    var modalInstance = $modal.open({
      animation: true,
      templateUrl: 'unit/page.html',
      controller: 'pages',
      size: 'lg',
      resolve: {
        remotePage: function () {
          return remoteCourses.id($routeParams.id).child('pages').id(pageUrl);
        }
      }
    });
  }

  // console.log($routeParams.id);
  $scope.loadPage = function(pageNum) {

    $q.all([
      remoteUnit.parent.get(),
      remoteUnit.get(),
      remoteUnit.child('items').get(),
      remoteTags.search({ unitId: $routeParams.id2 })
    ])
    .then(function(responses) {
      $scope.course = responses[0].data;
      $scope.module = responses[1].data;
      $scope.lessonItems = responses[2].data;
      countItemTypes($scope.lessonItems);
      $scope.tags = responses[3].data;

      lessonPlanItems.match(remoteUnit.parent, $scope.module, $scope.lessonItems);
    });
  }

  $scope.loadPage(1);
});