/* Codigo Pagar JS */
        function ValidaRutMobile(id){
            var texto = document.getElementById(id).value;
            texto = texto.toLowerCase();
            var tmpstr = "";
            for (i = 0; i < texto.length ; i++)
                if (texto.charAt(i) != ' ' && texto.charAt(i) != '.' && texto.charAt(i) != '-')
                    tmpstr = tmpstr + texto.charAt(i);
            texto = tmpstr;
            largo = texto.length;

            if (largo < 2) {
                document.getElementById(id).value = "";
                return false;
            }

            for (i = 0; i < largo ; i++) {
                if (texto.charAt(i) != "0" && texto.charAt(i) != "1" && texto.charAt(i) != "2" && texto.charAt(i) != "3" && texto.charAt(i) != "4" && texto.charAt(i) != "5" && texto.charAt(i) != "6" && texto.charAt(i) != "7" && texto.charAt(i) != "8" && texto.charAt(i) != "9" && texto.charAt(i) != "k" && texto.charAt(i) != "K") {
                    document.getElementById(id).value = "";                   
                    return false;
                }
            }

            var invertido = "";
            for (i = (largo - 1), j = 0; i >= 0; i--, j++)
                invertido = invertido + texto.charAt(i);
            var dtexto = "";
            dtexto = dtexto + invertido.charAt(0);
            dtexto = dtexto + '-';
            cnt = 0;

            for (i = 1, j = 2; i < largo; i++, j++) {
                if (cnt == 3) {
                    dtexto = dtexto + '.';
                    j++;
                    dtexto = dtexto + invertido.charAt(i);
                    cnt = 1;
                }
                else{
                    dtexto = dtexto + invertido.charAt(i);
                    cnt++;
                }
            }

            invertido = "";
            for (i = (dtexto.length - 1), j = 0; i >= 0; i--, j++)
                invertido = invertido + dtexto.charAt(i);

            document.getElementById(id).value = invertido.toUpperCase()

            if (revisarDigito2(texto, id))
                return true;


            document.getElementById(id).value = "";
            return false;
        }
        function ValidaRut(id){
            var texto = document.getElementById(id).value;
            texto = texto.toLowerCase();
            var tmpstr = "";
            for (i = 0; i < texto.length ; i++)
                if (texto.charAt(i) != ' ' && texto.charAt(i) != '.' && texto.charAt(i) != '-')
                    tmpstr = tmpstr + texto.charAt(i);
            texto = tmpstr;
            largo = texto.length;

            if (largo < 2) {

                document.getElementById(id).value = "";
                return false;
            }

            for (i = 0; i < largo ; i++) {
                if (texto.charAt(i) != "0" && texto.charAt(i) != "1" && texto.charAt(i) != "2" && texto.charAt(i) != "3" && texto.charAt(i) != "4" && texto.charAt(i) != "5" && texto.charAt(i) != "6" && texto.charAt(i) != "7" && texto.charAt(i) != "8" && texto.charAt(i) != "9" && texto.charAt(i) != "k" && texto.charAt(i) != "K") {
                    document.getElementById(id).value = "";                   
                    return false;
                }
            }

            var invertido = "";
            for (i = (largo - 1), j = 0; i >= 0; i--, j++)
                invertido = invertido + texto.charAt(i);
            var dtexto = "";
            dtexto = dtexto + invertido.charAt(0);
            dtexto = dtexto + '-';
            cnt = 0;

            for (i = 1, j = 2; i < largo; i++, j++) {
                if (cnt == 3) {
                    dtexto = dtexto + '.';
                    j++;
                    dtexto = dtexto + invertido.charAt(i);
                    cnt = 1;
                }
                else {
                    dtexto = dtexto + invertido.charAt(i);
                    cnt++;
                }
            }

            invertido = "";
            for (i = (dtexto.length - 1), j = 0; i >= 0; i--, j++)
                invertido = invertido + dtexto.charAt(i);

            document.getElementById(id).value = invertido.toUpperCase()

            if (revisarDigito2(texto, id))
                return true;


            document.getElementById(id).value = "";
            return false;
        }
        function revisarDigito(dvr, id) {
            dv = dvr + ""
            if (dv != '0' && dv != '1' && dv != '2' && dv != '3' && dv != '4' && dv != '5' && dv != '6' && dv != '7' && dv != '8' && dv != '9' && dv != 'k' && dv != 'K') {
                document.getElementById(id).value = "";
            
                return false;
            }
            return true;
        }
        function revisarDigito2(crut, id) {
            largo = crut.length;
            if (largo < 2) {
                return false;
            }
            if (largo > 2)
                rut = crut.substring(0, largo - 1);
            else
                rut = crut.charAt(0);
            dv = crut.charAt(largo - 1);
            revisarDigito(dv, id);

            if (rut == null || dv == null)
                return 0

            var dvr = '0'
            suma = 0
            mul = 2

            for (i = rut.length - 1 ; i >= 0; i--) {
                suma = suma + rut.charAt(i) * mul
                if (mul == 7)
                    mul = 2
                else
                    mul++
            }
            res = suma % 11
            if (res == 1)
                dvr = 'k'
            else if (res == 0)
                dvr = '0'
            else {
                dvi = 11 - res
                dvr = dvi + ""
            }
            if (dvr != dv.toLowerCase()) {
                document.getElementById(id).value = "";
            
                return false
            }

            return true
        }

        //no conflict jquery
        var passed = 0
        function valida_rut(rut, dvr_in) {
            var largo, i, mul = 1, suma = 0, digV;
            largo = rut.length;
            if (largo < 1 || !rut)
                return false;
            var dvr = '0';
            for (i = rut.length - 1 ; i >= 0; i--) {
                mul++;
                suma = suma + rut.charAt(i) * mul;
                if (mul == 7)
                    mul = 1;
            }
            res = suma % 11;
            if (res == 1)
                dvr = 'k';
            else
                if (res == 0)
                    dvr = '0';
                else {
                    dvr = (11 - res) + "";
                }
            if (dvr != dvr_in.toLowerCase())
                return false;
            return true;
        }
        function boton_pagar() {
            pagar_solo_con_rut();
            return false;
        };
        function pagar_solo_con_rut() {
            var rut_base = jQuery('#rut_pago_rapido').val();
            if (rut_base.indexOf("-") != -1) {
                var rut = rut_base.split("-")[0];
                var dv = rut_base.split("-")[1];

                if (valida_rut(rut.replace(/\./gi, ""), dv)) {
                    rut = "00000000" + rut.replace(/\./gi, "");
                    rut = rut.substr(rut.length - 11);
                    document.location.href = ("/web_clientes/clientes_vigentes/cl_pago_con_Rut_if.asp?rut=" + rut + "&leng=gral2");
                }
                else {
                    alert('El rut esta mal escrito')
                }
            }
            else {
                alert('El Rut debe ser ingresado como 12464622-7');
            }
        }
        -->
        function pago_web(nombre) {
            var rut = document.getElementById(nombre).value;
            rut = rut.replace(/\./gi, "");
            if (rut != "") {
                if (rut.indexOf("-") != -1) {
                    if (rut.length > 5) {
                        var valores = rut.split('-');
                        var rut = valores[0];
                        var dv = valores[1].toUpperCase();
                        if (dv.length > 1) {
                            alert('El rut está mal escrito')
                        }
                        else {
                            if (!valida_rut(rut.replace(/\./g,''), dv)) {
                                alert("RUT no válido");
                                return false;
                            }
                                                             
                                document.getElementById("form1").action = "/club/irPagos.asp";
                                var rutTime = "00000000" + rut.replace(/\./gi, "");
                                rutTime = rutTime.substr(rutTime.length - 11);                               
                               document.getElementById("rut").value=rutTime;							   
								document.getElementById("form1").submit()
                               
                                   
                                
                        }
                    }
                    else {
                        alert("El rut está mal escrito");
                    }

                }
                else {
                    alert('El Rut debe ser ingresado como 12464622-7');
                }

            }
            else {
                alert("Por favor, debe ingresar su RUT.");
            }
        };
        function pago_web_mobile() {
            var rut = document.getElementById('txtRutMobile').value;
            rut = rut.replace(/\./gi, "");
            if (rut != "") {
                if (rut.indexOf("-") != -1) {
                    if (rut.length > 5) {
                        var valores = rut.split('-');
                        var rut = valores[0];
                        var dv = valores[1].toUpperCase();
                        if (dv.length > 1) {
                            alert('El rut está mal escrito')
                        }
                        else {
                            if (!valida_rut(rut.replace(/\./g,''), dv)) {
                                alert("RUT no válido");
                                return false;
                            }
                                document.getElementById("form1").action = "/club/irPagos.asp";
                                var rutTime = "00000000" + rut.replace(/\./gi, "");
                                rutTime = rutTime.substr(rutTime.length - 11);                               
                               document.getElementById("rut").value=rutTime;
							   
								document.getElementById("form1").submit()                        
                                    
                               
                        }
                    }
                    else {
                        alert("El rut está mal escrito");
                    }

                }
                else {
                    alert('El Rut debe ser ingresado como 12464622-7');
                }

            }
            else {
                alert("Por favor, debe ingresar su RUT.");
            }
        };
        function cotizar() {
            var opcion = $(".custom-select option:selected").val();
            $('#btn_CotizarSeguro').attr('href', opcion);
        }
        function cotizar_mobile() {
            var opcion = $(".pagar option:selected").val();
            $('#btn_CotizarSeguroMobile').attr('href', opcion);
        }

        /* Codigo Siniestro JS */
        function IngresoClienteMobile(){
            var pag= window.location.protocol + "//" + window.location.host;
            var btn = document.getElementById('btn_IngZonCli');
            var rut = document.getElementById('txtRutSiniestroMobile').value;
            var pass = document.getElementById('passwordSiniestroMobile').value;
            if (window.location.pathname.toLowerCase().indexOf('home')  >= 0 )
                $('#origen').val('7');
            $.ajax({
                type: "POST",
                url:  pag + '/home/home2006/index_ajax.asp',
                dataType: 'json',
                data: $("#loginSiniestroMobile").serialize(),
                async: false,
                success: function (data) {
                    if (data.Error != "") {
                        $(".modal .close").click()
                        if (data.Confirm =="N"){
                            document.getElementById('lblAviso').innerHTML = data.Error;
                            $('#myModal').modal('show');
                        } else {
                            document.getElementById('lblConfirmacionContenido').innerHTML = data.Error;
                            $('#myModalConfirmacion').modal('show');
                            $("#hConfirmacionURL").val(data.URL);
                        }    
                    } else {                        
                        setTimeout(function() { location.href= data.URL; }, 0);                      
                    }

                },
                error: function (response) {
                    $(".modal .close").click()              
                }
            })
        }
        function loginMobile() {
            var btn = document.getElementById('btn_IngZonCli');
            var rut = document.getElementById('txtRutSiniestroMobile').value;
            var pass = document.getElementById('passwordSiniestroMobile').value;
            rut = rut.replace(/\./gi, "");
            if (rut != "") {
                if (pass != "") {
                    if (rut.indexOf("-") != -1) {
                        if (rut.length > 5) {
                            var valores = rut.split('-');
                            var rut = valores[0];
                            var dv = valores[1];
                            if (dv.length > 1) {
                                openModal('El rut está mal escrito');
                                return false;
                            }
                            else {
                                if (valida_rut(rut, dv)) {
                                    
                                        ir_ajax_Mobile('LoginFusion');
                                        return false;
                                   
                                }
                                else {
                                    openModal("RUT no válido. Por favor, intente nuevamente.");
                                    return false;
                                }
                            }
                        }
                        else {
                            openModal("El rut está mal escrito. Por favor, intente nuevamente.");
                            return false;
                        }
                    }
                    else {
                        openModal('El Rut debe ser ingresado como 12464622-7. Por favor, intente nuevamente.');
                        return false;
                    }
                }
                else {
                    openModal('La contraseña no puede estar vacía');
                    return false;
                }
            }
            else {
                openModal("El RUT no puede estar vacío. Por favor, intente nuevamente.");
                return false;
            }
            return false;
        }
        function ir_ajax_Mobile(accion, lstArg){
            var xmlHttp;
            var pag= window.location.protocol + "//" + window.location.host;
            try {
                // Firefox, Opera 8.0+, Safari
                xmlHttp = new XMLHttpRequest();
            }
            catch (e) {
                // Internet Explorer
                try {
                    xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
                }
                catch (e) {
                    try {
                        xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                    }
                    catch (e) {
                        return false;
                    }
                }
            }

            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4) {
                    //alert(a);
                    var ThereAreFilePDF = xmlHttp.responseText;
                    if (ThereAreFilePDF != "") {
                        //alert(ThereAreFilePDF);
                        try {
                            eval(ThereAreFilePDF);
                            //document.getElementById('preloader').style.visibility='hidden';
                        }
                        catch (e) {
                            //alert(e.message);
                            if (ThereAreFilePDF.indexOf("self.top.location=document.location.href") > 100) {
                                document.location.href = "/club/caduca.asp";
                                return;
                            }
                            //alert(ThereAreFilePDF);
                                var btn = document.getElementById('btn_IngZonCli');
                                return false;
                            //location.reload();
                        }
                        //ele_td.innerHTML = ThereAreFilePDF;
                    }
                    else {
                        alert("No se pudo conectar a www.hdi.cl");
                        status_err = true;
                    }
                }
            }
            //document.title = accion;
            switch (accion) {
                case 'LoginFusion':
                    var rut = document.getElementById('txtRutSiniestroMobile').value;
                    var clave = document.getElementById('passwordSiniestroMobile').value;
                    pag = pag + "/net/cliente/reg_cliente/loginmh.aspx?usuario=" + rut + "&clave=" + clave + "&accion=consulta";
                    break;
                case 'UpdateFusion':
                    var person_typ = document.getElementById('txtPersonTyp').value;
                    var migrado = document.getElementById('txtMigrado').value;
                    var client = document.getElementById('txtClient').value;
                    var clave = document.getElementById('txtPassNueva').value;
                    var mail = document.getElementById('txtMailUpd').value;
                    pag = pag + "/net/cliente/reg_cliente/loginmh.aspx?usuario=" + client + "&clave=" + clave + "&person_typ=" + person_typ + "&migrado=" + migrado + "&mail=" + mail + "&accion=update";
                    break;
                case 'InsertFusion':
                    var person_typ = document.getElementById('txtPersonTyp').value;
                    var migrado = document.getElementById('txtMigrado').value;
                    var client = document.getElementById('txtClient').value;
                    var clave = document.getElementById('txtPassInsert').value;
                    var nombre = document.getElementById('txtNombre').value;
                    var apaterno = document.getElementById('txtAPaterno').value;
                    var amaterno = document.getElementById('txtAMaterno').value;
                    var mail = document.getElementById('txtMailIns').value;
                    pag = pag + "/net/cliente/reg_cliente/loginmh.aspx?usuario=" + client + "&clave=" + clave + "&cliename=" + nombre + "&apaterno=" + apaterno + "&amaterno=" + amaterno + "&person_typ=" + person_typ + "&migrado=" + migrado + "&mail=" + mail + "&accion=insert";
                    break;
            }
            //alert("x=>busca_inst.asp?"+arg /*Url.encode(arg)*/);
            xmlHttp.open("GET", pag /*Url.encode(arg)*/, false);
            xmlHttp.send(null);

        }    

        function IngresoCliente(){
            var pag= window.location.protocol + "//" + window.location.host;
            var btn = document.getElementById('btn_IngZonCli');
            var rut = document.getElementById('txtRutSiniestro').value;
            var pass = document.getElementById('passwordSiniestro').value;
            if (window.location.pathname.toLowerCase().indexOf('home')  >= 0 )
                $('#origen').val('7');
            $.ajax({
                type: "POST",
                url:  pag + '/home/home2006/index_ajax.asp',
                dataType: 'json',
                data: $("#loginSiniestro").serialize(),
                async: false,
                success: function (data) {
                    if (data.Error != "") {
                        $(".modal .close").click()
                        if (data.Confirm =="N"){
                            document.getElementById('lblAviso').innerHTML = data.Error;
                            $('#myModal').modal('show');
                        } else {
                            document.getElementById('lblConfirmacionContenido').innerHTML = data.Error;
                            $('#myModalConfirmacion').modal('show');
                            $("#hConfirmacionURL").val(data.URL);
                        }    
                    } else {                        
                        setTimeout(function() { location.href= data.URL; }, 0);                      
                    }

                },
                error: function (response) {
                    $(".modal .close").click()          
                }
            })
        }
        function login() {
            var btn = document.getElementById('btn_IngZonCli');
            var rut = document.getElementById('txtRutSiniestro').value;
            var pass = document.getElementById('passwordSiniestro').value;
            rut = rut.replace(/\./gi, "");
            if (rut != "") {
                if (pass != "") {
                    if (rut.indexOf("-") != -1) {
                        if (rut.length > 5) {
                            var valores = rut.split('-');
                            var rut = valores[0];
                            var dv = valores[1];
                            if (dv.length > 1) {
                                openModal('El rut está mal escrito');
                                return false;
                            }
                            else {
                                if (valida_rut(rut, dv)) {
                                    
                                        ir_ajax('LoginFusion');
                                        return false; 
                                   
                                }
                                else {
                                    openModal("RUT no válido. Por favor, intente nuevamente.");
                                    return false;
                                }
                            }
                        }
                        else {
                            openModal("El rut está mal escrito. Por favor, intente nuevamente.");
                            return false;
                        }
                    }
                    else {
                        openModal('El Rut debe ser ingresado como 12464622-7. Por favor, intente nuevamente.');
                        return false;
                    }
                }
                else {
                    openModal('La contraseña no puede estar vacía');
                    return false;
                }
            }
            else {
                openModal("El RUT no puede estar vacío. Por favor, intente nuevamente.");
                return false;
            }
            return false;
        }
        function ir_ajax(accion, lstArg){
            var xmlHttp;
            var pag= window.location.protocol + "//" + window.location.host;
            try {
                // Firefox, Opera 8.0+, Safari
                xmlHttp = new XMLHttpRequest();
            }
            catch (e) {
                // Internet Explorer
                try {
                    xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
                }
                catch (e) {
                    try {
                        xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
                    }
                    catch (e) {  
                        return false;
                    }
                }
            }

            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState == 4) {
                    //alert(a);
                    var ThereAreFilePDF = xmlHttp.responseText;
                    if (ThereAreFilePDF != "") {
                        try {
                            eval(ThereAreFilePDF);
                        }
                        catch (e) {
                            if (ThereAreFilePDF.indexOf("self.top.location=document.location.href") > 100) {
                                document.location.href = "/club/caduca.asp";
                                return;
                            }
                                var btn = document.getElementById('btn_IngZonCli');
                                return false;
                        }
                    }
                    else {
                        alert("No se pudo conectar a www.hdi.cl");
                        status_err = true;
                    }
                }
            }
            //document.title = accion;
            switch (accion) {
                case 'LoginFusion':
                    var rut = document.getElementById('txtRutSiniestro').value;
                    var clave = document.getElementById('passwordSiniestro').value;
                    pag = pag + "/net/cliente/reg_cliente/loginmh.aspx?usuario=" + rut + "&clave=" + clave + "&accion=consulta";
                    break;
                case 'UpdateFusion':
                    var person_typ = document.getElementById('txtPersonTyp').value;
                    var migrado = document.getElementById('txtMigrado').value;
                    var client = document.getElementById('txtClient').value;
                    var clave = document.getElementById('txtPassNueva').value;
                    var mail = document.getElementById('txtMailUpd').value;
                    pag = pag + "/net/cliente/reg_cliente/loginmh.aspx?usuario=" + client + "&clave=" + clave + "&person_typ=" + person_typ + "&migrado=" + migrado + "&mail=" + mail + "&accion=update";
                    break;
                case 'InsertFusion':
                    var person_typ = document.getElementById('txtPersonTyp').value;
                    var migrado = document.getElementById('txtMigrado').value;
                    var client = document.getElementById('txtClient').value;
                    var clave = document.getElementById('txtPassInsert').value;
                    var nombre = document.getElementById('txtNombre').value;
                    var apaterno = document.getElementById('txtAPaterno').value;
                    var amaterno = document.getElementById('txtAMaterno').value;
                    var mail = document.getElementById('txtMailIns').value;
                    pag = pag + "/net/cliente/reg_cliente/loginmh.aspx?usuario=" + client + "&clave=" + clave + "&cliename=" + nombre + "&apaterno=" + apaterno + "&amaterno=" + amaterno + "&person_typ=" + person_typ + "&migrado=" + migrado + "&mail=" + mail + "&accion=insert";
                    break;
            }
            //alert("x=>busca_inst.asp?"+arg /*Url.encode(arg)*/);
            xmlHttp.open("GET", pag /*Url.encode(arg)*/, false);
            xmlHttp.send(null);

        }    
        function openModal(mensaje) {
            if (mensaje != '') {
                document.getElementById('avisoSiniestro').innerHTML = mensaje;
                $('#myModal').modal('show');                
            }
        }

		function setURL(panel) {
			var fram = document.getElementById('ifram');
			var d = new Date();
			var usuario = document.getElementById('txtRutSiniestroMobile').value;
			if (panel == "CREAR")
				$("#modalAyudaLabel").html("Cree su clave");
			else
				$("#modalAyudaLabel").html("¿Olvidó su clave?");
			fram.src = '/home/asistencia_clave.asp?date=' + d + '&usuario=' + usuario + '&panel='+ panel;			
		}
		function validarCaptcha()
		{
			 $.ajax({
				 type: "POST",
					 url: '/club/validarCaptcha.asp',
						 dataType: 'json',
							 data: $("#loginJGI").serialize(),
								 async: false,
									 success: function (data) {
										 if (data.Respuesta != "OK") {

											 $(".modal .close").click()
												 openModal(data.Respuesta);
											 return false;
										 }
										 else {
											 return true;
										 }
									 },
										 error: function (response) {

											 $(".modal .close").click()
											openModal("Problemas para acceder. Por favor, inténtelo de nuevo más tarde.");
											 return false;
										 }
			 });
		}