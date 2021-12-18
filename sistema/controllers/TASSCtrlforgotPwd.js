var moduleForgotPwd = angular.module("module.ForgotPwd", ["tokenSystem", "services.User"]);

moduleForgotPwd.controller('ForgotPwdCtrl', function($scope, $rootScope, $location, $http, blockUI, inputService, userServices, $timeout, tokenSystem, serverHost, inform, $window, APP_SYS, APP_REGEX){
  console.log(APP_SYS.app_name+" Module Forgot Password User");
  $scope.launchLoader = function(){
    $scope.wLoader  = true;
     $timeout(function() {
       $('#loader').fadeOut();
       $('#wLoader').delay(3500).fadeOut('slow'); 
       $scope.wLoader  = false;
     }, 1500);
   }

  $scope.newpwd={"user":{"emailUser":'', "dni":''}}
  $scope.forgot={email: '', dni:''};
  tokenSystem.destroyTokenStorage(2);
  $scope.sysToken      = tokenSystem.getTokenStorage(1);
  $scope.sysLoggedUser = tokenSystem.getTokenStorage(2);
  $scope.sysRsTmpUser = tokenSystem.getTokenStorage(3);
  if (!$scope.sysToken && !$scope.sysLoggedUser){
    if($scope.sysRsTmpUser){
      if($scope.sysRsTmpUser.dni!=null && APP_REGEX.checkDNI.test($scope.sysRsTmpUser.dni)){
        $scope.forgot.dni = $scope.sysRsTmpUser.dni;
        setTimeout(function() {
          $('#forgotdni').addClass('active');
          $('#forgotemail').focus();
        }, 100);
      }
      if($scope.sysRsTmpUser.emailUser!=null && APP_REGEX.checkEmail.test($scope.sysRsTmpUser.emailUser)){
        $scope.forgot.email = $scope.sysRsTmpUser.emailUser
        setTimeout(function() {
          $('#forgotemail').addClass('active');
          $('#forgotdni').focus();
        }, 100);
      }
    }else{
      setTimeout(function() {
        $('#forgotdni').addClass('active');
        $('#forgotdni').focus();
      }, 100);
    }
  }else{
    tokenSystem.destroyTokenStorage(2);
    tokenSystem.destroyTokenStorage(3);
    $location.path("/");
  } 

  
  /**************************************************
  *                                                 *
  *                LOST PWD USER                    *
  *                                                 *
  **************************************************/
      $scope.sysPwdRequest = function(){
        if(($scope.sysRsTmpUser.emailUser!=null && APP_REGEX.checkEmail.test($scope.forgot.email) &&  $scope.forgot.email == $scope.sysRsTmpUser.emailUser) && ($scope.sysRsTmpUser.dni!=null && APP_REGEX.checkDNI.test($scope.forgot.dni) &&  $scope.forgot.dni == $scope.sysRsTmpUser.dni)){
          console.log($scope.forgot);
          $scope.newpwd.user.dni=$scope.forgot.dni;
          $scope.newpwd.user.emailUser=$scope.forgot.email;
          blockUI.start('Restableciendo la clave de usuario.');
          $timeout(function() {
            $scope.recoverPwdUser($scope.newpwd);
          }, 1500); 
        }else{
          $scope.sysCheckEmail();
        }

      }
  /**************************************************
  *                                                 *
  *             REQUEST PWD FUNCTION                *
  *                                                 *
  **************************************************/
      $scope.recoverPwdUser = function (newpwd){
        console.log(newpwd);
          userServices.recoverPwd(newpwd).then(function(response){
            if(response.status==200){
              inform.add('La clave ha sido restablecida satisfactoriamente, por favor verifica tu casilla de correo.',{
                ttl:4000, type: 'warning'
              });
              blockUI.message('Su Nueva Clave fue enviada a su direccion de correo!');
              $timeout(function() {
                blockUI.stop();
                $location.path("/login");
              }, 1500);
            }else if(response.status==404){
              inform.add('[Error]: '+response.status+', Ocurrio error verifique los datos e intenta de nuevo o contacta el area de soporte. ',{
                ttl:5000, type: 'danger'
                });
            }else if(response.status==500){
              inform.add('[Error]: '+response.status+', Ha ocurrido un error en la comunicacion con servidor, contacta el area de soporte. ',{
                ttl:5000, type: 'danger'
                });
            }

          });
      }
  /**************************************************
  *                                                 *
  *             CHECK PWD FUNCTION                  *
  *                                                 *
  **************************************************/
      $scope.sysCheckEmail = function(){
        if($scope.forgot.dni){
          userServices.checkUserMail($scope.forgot.dni, "forgotPwd").then(function(data) {
            $scope.mailCheckResult= data; 
              if(!$scope.mailCheckResult){
                var attempsToken = JSON.parse(localStorage.getItem("attempsToken"));
                $scope.mailCheckCount = attempsToken.attempsCount;
                if($scope.mailCheckCount==3){
                  $scope.checkEmailLogin = 1;
                  $('#notificationModal').modal('show');
                }else{
                  inform.add('El numero de documento: '+ $scope.forgot.dni + ', no se encuentra registrado, verifique los datos ingresados.',{
                    ttl:4000, type: 'warning'
                  });
                  console.log("Email No registrado / "+ $scope.forgot.dni);
                }
              }else{
                $scope.recoverPwdUser();
              }
          });
        }
      }
  /**************************************************
  *                                                 *
  *            Modal de confirmacion                *
  *                                                 *
  **************************************************/
      $(document).on("click", ".modal-footer .modalYes" , function(){
        $('#notificationModal').modal('hide');
        $scope.modalConfirmation("register");
      });
      $(document).on("click", ".modal-footer .modalNo" , function(){
        $('#notificationModal').modal('hide');
        $scope.modalConfirmation("login");
      });
      $scope.modalConfirmation = function(value){
          switch (value){
            case 'register':
              $location.path("/register");
            break;
            case 'login':
              $location.path("/login");
            break;

            default:
          }
      }
  /**************************************************/
      $scope.fnLoadPhoneMask = function(){
        /**********************************************
        *               INPUT PHONE MASK              *
        **********************************************/
        $('.input--dni').mask('99999999');
      }
      $scope.inputCheckCss = function (obj) {
        var $this      = $('input[name*='+obj+']');
        var inputObj   = $this
        var inputValue = $this.val();
        inputService.setClass(inputValue, inputObj);
      }
});
