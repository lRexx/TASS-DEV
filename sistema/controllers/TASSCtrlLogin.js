var login = angular.module("module.Login", ["tokenSystem", "services.User"]);

/**************************************************************************
*                                                                         *
*               Servicio para validar si tiene un valor para              *
*                                                                         *
*                      agregar o remover la clase css                     *
***************************************************************************/
login.service("inputService",function(){
  return {
      setClass: function(value, obj) {
            if (value!==""){
                //console.log(value);
                //console.log(obj);
                obj.addClass('active');
            }else{
                obj.removeClass('active');
            }
      },
  }
});
login.directive('passwordConfirm', ['$parse', function ($parse) {
  return {
     restrict: 'A',
     scope: {
       matchTarget: '=',
     },
     require: 'ngModel',
     link: function link(scope, elem, attrs, ctrl) {
       var validator = function (value) {
         //console.log(value);
         ctrl.$setValidity('match', value === scope.matchTarget);
         return value;
       }
  
       ctrl.$parsers.unshift(validator);
       ctrl.$formatters.push(validator);
       
       // This is to force validator when the original password gets changed
       scope.$watch('matchTarget', function(newval, oldval) {
         validator(ctrl.$viewValue);
       });
 
     }
   };
 }]);
login.controller('LoginCtrl', function($scope, $location, $routeParams, blockUI, $timeout, inform, inputService, userServices, tokenSystem, serverHost, serverBackend, $window, APP_SYS){
  console.log(APP_SYS.app_name+" Modulo Login User");
  $scope.launchLoader = function(){
    $scope.wLoader  = true;
    $('#loader').delay(1500).fadeIn(function () {
      $('#wLoader').delay(1500).fadeOut('slow'); 
      $scope.wLoader  = false;
    });
   }  
   $('#loginEmail').addClass('active');
   $('#loginEmail').focus();
  $scope.login={"email":'', "passwd":'',"user":{"fullNameUser":'',"passwordUser":''}};
  $scope.login.selected_user={"user":{"fullNameUser":'',"passwordUser":''}};
  $scope.signup              = {email:''};
  $scope.signupUser          = false;
  $scope.loginUser           = true;
  $scope.mailCheckResult     = 0;
  $scope.loginResult         = 0;
  $scope.mailCheckCount      = 0;
  $scope.redirect2NewPwd     = false;
  $scope.redirect2RestorePwd = false;
  $scope.redirect2Register   = false;
  $scope.redirect2MainApp    = false;
  $scope.swOption            = "";
  tokenSystem.destroyTokenStorage(4);
  $scope.redirect ="/";
  $scope.sysToken      = tokenSystem.getTokenStorage(1);
  $scope.sysLoggedUser = tokenSystem.getTokenStorage(2);
  if ($scope.sysToken && $scope.sysLoggedUser!=undefined){
      $location.path($scope.redirect);
  }

  /**************************************************
  *                                                 *
  *         PARAMETER TO AUTHORIZE A TICKET         *
  *                                                 *
  **************************************************/

  /* USAGE: /login/auth/ticket/id/tokenId/token/secureToken */
  if($routeParams.ticketId && $routeParams.secureToken){
    $scope.ticketId = $routeParams.ticketId;
    $scope.secureToken = $routeParams.secureToken;
    console.log("$scope.ticketId :" +$scope.ticketId+"$scope.secureToken: "+$scope.secureToken);
    inform.add('Inicia la sesion para autorizar el ticket:  '+$scope.ticketId,{
    ttl:5000, type: 'info'
    });
  }
    

    

  /**************************************************
  *                                                 *
  *       VALIDACION DE EMAIL ANTES DEL LOGIN       *
  *                                                 *
  **************************************************/
      $scope.sysCheckEmailLogin = function(login){
        if(login.user.fullNameUser){
          userServices.checkUserMail(login.user.fullNameUser, "login").then(function(data) {
            $scope.mailCheckResult= data;
            //console.log("[sysCheckEmailLogin] --> mailCheckResult: "+$scope.mailCheckResult); 
              if(!$scope.mailCheckResult || $scope.mailCheckResult==500 || $scope.mailCheckResult==503){
                if($scope.mailCheckResult==500 || $scope.mailCheckResult==503){
                  inform.add('[Error]: '+$scope.mailCheckResult+', Ha ocurrido un error en la comunicacion con servidor, contacta el area de soporte. ',{
                  ttl:5000, type: 'danger'
                  });
                }else{
                  var attempsToken = JSON.parse(localStorage.getItem("attempsToken"));
                  $scope.mailCheckCount = attempsToken.attempsCount;

                  if($scope.mailCheckCount==3){
                    $scope.checkEmailLogin = 1;
                    console.log($scope.mailCheckCount);
                    $scope.swOption = "register";
                    $scope.msg1="Ha realizado "+$scope.mailCheckCount+" intentos fallidos de ingreso con el correo "+login.user.fullNameUser;
                    $scope.msg2="Desea realizar el registro de usuario?";
                    $scope.mailCheckCount++;
                    $("#loginEmail").popover({
                      container: 'body',
                      placement:'auto right',
                      trigger: 'manual',
                      sanitize: false,
                      content: function() {
                        var content = $(this).attr("data-popover-content");
                        return $(content).children(".popover-body").html();
                      },
                      title: function() {
                        var title = $(this).attr("data-popover-content");
                        return $(title).children(".popover-heading").html();
                      },
                      template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div><div class="popover-footer"><button type="button" class="btn btn-sm btn-success modalYes">Si</button>&nbsp<button type="button" class="btn btn-sm btn-danger modalNo" data-dismiss="modal">No</button></div></div>'
                    }); 
                    $("#loginEmail").popover('show');
                  }else{
                    console.log($scope.mailCheckResult);
                    inform.add('El Correo: '+ login.user.fullNameUser + ', no se encuentra registrado, verifique los datos ingresados.',{
                      ttl:4000, type: 'warning'
                    });
                    console.log("Email No registrado / "+ login.user.fullNameUser);
                  }
                }
              }else{
                var sysCheckEmailLogin=true;
                $scope.sysLoginUser(login);
              }
          });
        }
      }  
  /**************************************************/

  /**************************************************
  *                                                 *
  *        VALIDACION DE PWD ANTES DEL LOGIN        *
  *                                                 *
  **************************************************/
      $scope.sysCheckPasswordLogin = function(){
        var attempsToken = JSON.parse(localStorage.getItem("attempsToken"));
          $scope.mailCheckCount = attempsToken.attempsCount;
          if($scope.mailCheckCount==3){
            $scope.checkPasswdLogin = 1;
            //console.log($scope.mailCheckCount);
            $scope.msg1="Ha ingresado en "+$scope.mailCheckCount+" oportunidades la clave incorrecta. ";
            $scope.msg2="Desea restablecer la Contrase&#241a de su cuenta?";
                  $scope.mailCheckCount++;
            $("#loginpassword").popover({
              container: 'body',
              placement:'auto right',
              trigger:'manual',
              sanitize: false,
              content: function() {
                var content = $(this).attr("data-popover-content");
                return $(content).children(".popover-body").html();
              },
              title: function() {
                var title = $(this).attr("data-popover-content");
                return $(title).children(".popover-heading").html();
              },
              template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title pop-warning"></h3><div class="popover-content"></div><div class="popover-footer"><button type="button" class="btn btn-sm btn-success modalYes">Si</button>&nbsp<button type="button" class="btn btn-sm btn-danger modalNo" data-dismiss="modal">No</button></div></div>'
            }); 
            $("#loginpassword").popover('show');
          }else{
            inform.add('Ha ingresado una Contrasena incorrecta, verifique los datos ingresados.',{
              ttl:4000, type: 'warning'
            });
            console.log("Email No registrado / "+ $scope.login.email+ " o Clave incorrecta.");
          }
      }
  /**************************************************/
  /**************************************************
  *                                                 *
  *                LOGIN DE USUARIO                 *
  *                                                 *
  **************************************************/
      $scope.sysLoginUser = function(value){
        $scope.checkEmailLogin    = 0;
        $scope.checkPasswdLogin = 0;
        if($scope.mailCheckResult){
          userServices.letLogin(value).then(function(data){
          $scope.loginResult = data;
          console.log("Value returned by the LoginService: "+$scope.loginResult);
          switch ($scope.loginResult){
            case 1:
              $window.location.reload();
            break;
            case 2:
              $location.path("/newpwd");
            break;
            case 3:
              //$scope.redirect2ResendEmail = true;
              //$location.path("#/resendemail");
              var rsTmpUser = tokenSystem.getTokenStorage(3);
              $scope.msg1="Disculpa, "+rsTmpUser.fullNameUser+", para continuar debe confirmar su correo electronico.";
              $scope.msg2="Verifica tu casilla de correo."
              $('#notificationModal').modal('show');
            break;
            case 4:
              var rsTmpUser = tokenSystem.getTokenStorage(3);

              $scope.msg1="Disculpa "+rsTmpUser.fullNameUser+" la cuenta esta inactiva.";
              $scope.msg2="Comunicate con el area de soporte o la administración."
              $('#notificationModal').modal('show');
                /*$timeout(function() {
                  $('#notificationModal').modal('hide');
                }, 3000);*/
            break;
            case 5:
              $scope.sysCheckPasswordLogin();
            break;
            case 6:
              inform.add('Ha ingresado una Contrasena incorrecta, verifique los datos ingresados.',{
                ttl:4000, type: 'warning'
              });
            break;
            case 10:
              var rsTmpUser = tokenSystem.getTokenStorage(3);

              $scope.msg1="Disculpa "+rsTmpUser.fullNameUser+" no esta habilitado como usuario del sistema .";
              $scope.msg2="Comunicate con el area de soporte o la administración."
              $('#notificationModal').modal('show');
                /*$timeout(function() {
                  $('#notificationModal').modal('hide');
                }, 3000);*/
            break;  
            default:
          }
          });
        }else{
          $scope.sysCheckEmailLogin();
        }
              
      };
  /**************************************************
  *                                                 *
  *    VALIDACION DE EMAIL ANTES DEL REGISTRARSE    *
  *                                                 *
  **************************************************/
      $scope.sysCheckBeforeSignup = function(){
        userServices.checkUserMail($scope.signup.email, "register").then(function(data) {
          $scope.mailCheckResult= data;
          if($scope.mailCheckResult==500 || $scope.mailCheckResult==503){
            if($scope.mailCheckResult==500 || $scope.mailCheckResult==503){
              inform.add('[Error]: '+$scope.mailCheckResult+', Ha ocurrido un error en la comunicacion con servidor, contacta el area de soporte. ',{
              ttl:5000, type: 'danger'
              });
            }
          }else if ($scope.mailCheckResult){
            console.log("Mail check attemps: "+$scope.mailCheckCount);
            $scope.swOption = "forgotpwd";
            $scope.msg1="El dni/correo "+$scope.signup.email+", se encuentra registrado en nuestro sistema.";
            $scope.msg2="Desea restablacer su clave?";
            $('#confirmRequestModal').modal('show');
              $("#signupemail").popover({
                container: 'body',
                placement:'auto right',
                trigger: 'manual',
                sanitize: false,
                title: '<div>TASS Seguridad</div>',
                template: '<div class="popover"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div><div class="popover-footer"><button type="button" class="btn btn-sm btn-success modalYes">Si</button>&nbsp<button type="button" class="btn btn-sm btn-danger modalNo" data-dismiss="modal">No</button></div></div>',
                html: true
            }); 
            $("#signupemail").popover('show');
            inform.add('El correo: '+ $scope.signup.email + ', se encuentra registrado, puede ingresar con su clave o restablecerla si no la recuerda.',{
              ttl:4000, type: 'success'
            });
            console.log("Email registrado / "+ $scope.signup.email);
          }else{
            $scope.redirect2Register = true;
            $location.path("/register");
          }
        });
      } 
  /**************************************************
  *                                                 *
  *                CHECK MAIL OR DNI                *
  *                   DUPLICATES                    *
  *                                                 *
  **************************************************/
      $scope.user2LoginList={};
      $scope.sysCheck4Duplicates = function(){
        var value = $scope.login.email;
        console.log($scope.login.email)
        if(value){
          userServices.findUserByEmail(value).then(function(response) {
            console.log(response);
            if(response.status==200){
              if (response.data.length>1){
                $scope.user2LoginList=response.data;
                $("#SelectUserFirst").modal('show');
              }else{
                $scope.login.user.fullNameUser=response.data[0].dni==null?response.data[0].emailUser:response.data[0].dni;
                $scope.login.user.passwordUser=$scope.login.passwd;
                $scope.sysCheckEmailLogin($scope.login);
              }
              
            }else if (response.status==404){
              $scope.login.user.fullNameUser=value;
              $scope.sysCheckEmailLogin($scope.login);
            }
          });
        }
      }
  /**************************************************
  *                                                 *
  *              SELECTED USER TO LOGIN             *
  *                                                 *
  **************************************************/
      $scope.getSelectedUSer2Login = function(item){
          console.log(item);
          $("#SelectUserFirst").modal('hide');
          $scope.login.user.fullNameUser=item.dni==null?item.emailUser:item.dni;
          $scope.login.user.passwordUser=$scope.login.passwd;
          $scope.sysCheckEmailLogin($scope.login);
      }
  /**************************************************
  *                                                 *
  *            Modal de confirmacion                *
  *                                                 *
  **************************************************/
      $(document).on("click", ".popover-footer .modalYes" , function(){
            if($scope.login.email && $scope.checkEmailLogin){
              $("#loginEmail").popover('hide');
              blockUI.start('Iniciando registro de usuario.');
              $timeout(function() {
                $scope.modalConfirmation("register");
              }, 1500); 
            }else if($scope.login.email && $scope.checkPasswdLogin){
              $("#loginpassword").popover('hide');
              blockUI.start('Cargando datos para iniciar proceso de recuperar clave.');
              $timeout(function() {
                $scope.modalConfirmation("forgotpwd");
              }, 1500); 
            }else if($scope.signup.email){
              $("#signupemail").popover('hide');
              blockUI.start('Cargando datos para iniciar proceso de recuperar clave.');
              $timeout(function() {
                $scope.modalConfirmation("forgotpwd");
              }, 1500); 
            }
      });
      $(document).on("click", ".popover-footer .modalNo" , function(){
              $("#loginEmail").popover('hide');
              $("#signupemail").popover('hide');
              $("#loginpassword").popover('hide');
              tokenSystem.destroyTokenStorage(4);
      });
      $scope.modalConfirmation = function(value){
          switch (value){
            case 'register':
              blockUI.message('Completa todos los datos correctamente.');
              $timeout(function() {
                blockUI.stop();
                $location.path("/register");
              }, 1000); 
            break;
            case 'forgotpwd':
              blockUI.message('Verifique los datos, antes de continuar.');
              $timeout(function() {
                blockUI.stop();
                $location.path("/forgotpwd");
              }, 1000); 
            break;

            default:
          }
      }
  /**************************************************/



  /**************************************************
  *                                                 *
  *         TRANSICIÓN DE LOGIN A REGISTRO          *
  *                                                 *
  **************************************************/
  var $loginMsg  = $('.textcontent1'),
      $signupMsg = $('.textcontent2'),
      $frontbox  = $('.frontbox');

  $scope.fnLoginToggle = function(swLogin){
    switch (swLogin){
      case 1:
        $frontbox.addClass('moving');
        $scope.signupUser=true; 
        $scope.loginUser=false;
        $scope.signup  = {email:''};
        $scope.login   = {email:'', passwd:''};
        $("#loginEmail").popover('hide');
        $("#signupemail").popover('hide');
      break;
      case 2:
        $frontbox.removeClass("moving");
        $scope.signupUser=false; 
        $scope.loginUser=true;
        $scope.signup  = {email:''};
        $scope.login   = {email:'', passwd:''};
        $("#loginEmail").popover('hide');
        $("#signupemail").popover('hide');
      break;
      default:

    }
  }
  /**************************************************/
  $scope.checkUserAdd = function(){ 
    $scope.$on('message', function(event, response) {
        console.log(response);
    });
    if($scope.mensajeTest){       
      inform.add('Usuario registrado con exito. ',{
                  ttl:2000, type: 'success'
      });
    }
    //console.log($scope.mensajeTest);
  }

  $scope.inputCheckCss = function (obj) {
      var $this      = $('input[name*='+obj+']');
      //console.log($this)
      var inputObj   = $this
      var inputValue = $this.val();
      inputService.setClass(inputValue, inputObj);
  }

});

