module.exports = {
    alertWindow: (message, location) => {
        return `<script type="text/javascript">alert("${message}}"); 
                document.location.href="${location}";</script>`
    }
  }