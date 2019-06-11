import 'bootstrap/dist/js/bootstrap.min';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'jquery-ujs';
import $ from 'jquery';

// auto hide flash message
window.setTimeout(() => {
  $('.alert').fadeTo(500, 0).slideUp(500, (thi) => {
    $(thi).remove();
  });
}, 1000);

// import 'jquery-mask-plugin';

// import $ from 'jquery';
//
// $(document).ready(() => {
//   $('#email').mask('#.##', {
//     recursive: true,
//     translation: { A: { pattern: /[a-z]/, recursive: true } },
//   });
//   $('.ip_address')
//     .mask('0ZZ.0ZZ.0ZZ.0ZZ', { translation: { Z: { pattern: /[0-9]/, optional: true } } });
// });
