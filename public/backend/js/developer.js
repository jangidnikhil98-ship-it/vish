var base_path =  $('.base-path-url').attr("data-url"); 
var csrf_token = $('meta[name="csrf-token"]').attr('content');

$(document).on('click', '.deleteRecord', function(e) {
  e.preventDefault();
  let userId = $(this).data('id');
  let link = $(this).attr('href');
  $('#deleteModal').find('#confirmDelete').data('url',link);
  $('#deleteModal').modal('show');
});
	
/* for status active ajax start*/	

$(document).on('click','.changeStatus',function(e) {
		  event.preventDefault();
		  var url 	= $(this).attr("href");  
          _this 		= $(this);
          var status 	= $(this).attr('data-status');
          var id 		= $(this).attr('data-id');
          var table 	= $(this).attr('data-table');
          $.ajax({
              url: url,
              type: 'POST',
              dataType: "json",
              data: {
                  status:status,
                  id:id,
                  table:table,
                  _token: csrf_token
              },
              beforeSend: function() {
                $(".loderClass").show();
            },
            complete: function() {
                $(".loderClass").hide();
            },
              success: function(data) {
                if(status == 0){
                      _this.attr("disabled", false);
                      _this.text('Inactive');
                      _this.removeClass('badge rounded-pill badge-success p-2 statusChange');
                       _this.addClass('badge rounded-pill badge-danger p-2 statusChange cursorPointer');
                       _this.attr('data-status',1);

                }else{
                    _this.attr("disabled", false);
                      _this.text('Active');
                      _this.removeClass('badge rounded-pill badge-danger p-2 statusChange cursorPointer');
                       _this.addClass('badge rounded-pill badge-success p-2 statusChange');
                       _this.attr('data-status',0);
                }
              }
          });

      });
 
 