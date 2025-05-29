package com.example.myapplication

import com.example.myapplication.databinding.ActivityFullscreenBinding
import android.Manifest
import android.annotation.SuppressLint
import android.app.Activity
import android.app.DownloadManager
import android.content.*
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.util.Log
import android.view.View
import android.view.WindowManager
import android.webkit.*
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat

/**
 * An example full-screen activity that shows and hides the system UI (i.e.
 * status bar and navigation/system bar) with user interaction.
 */
class FullscreenActivity : AppCompatActivity() {

    var mGeolocationCallback: GeolocationPermissions.Callback? = null
    var mGeolocationOrigin: String? = null

    var mDownloadManager: DownloadManager? = null
    var mDownloadRequest: DownloadManager.Request? = null

    private var initedWebView = false

    private lateinit var binding: ActivityFullscreenBinding
    private val hideHandler = Handler()

    private val hideRunnable = Runnable { hide() }

    @SuppressLint("ClickableViewAccessibility")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        binding = ActivityFullscreenBinding.inflate(layoutInflater)
        setContentView(binding.root)

        supportActionBar?.setDisplayHomeAsUpEnabled(true)
    }

    override fun onPostCreate(savedInstanceState: Bundle?) {
        super.onPostCreate(savedInstanceState)

        // Trigger the initial hide() shortly after the activity has been
        // created, to briefly hint to the user that UI controls
        // are available.
        delayedHide(100)

        this.registerReceiver(onCompleteDownload, IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE))

        initWebView(binding.webView)
        binding.webView.loadUrl(REQUESTED_MAIN_URL)
    }

    private fun hide() {
        // Hide UI first
        supportActionBar?.hide()
    }

    /**
     * Schedules a call to hide() in [delayMillis], canceling any
     * previously scheduled calls.
     */
    private fun delayedHide(delayMillis: Int) {
        hideHandler.removeCallbacks(hideRunnable)
        hideHandler.postDelayed(hideRunnable, delayMillis.toLong())
    }

    private val onCompleteDownload = object: BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            if (intent != null && context != null) {
                val action = intent.action
                if (DownloadManager.ACTION_DOWNLOAD_COMPLETE == action) {
                    val downloadId = intent.getLongExtra(
                        DownloadManager.EXTRA_DOWNLOAD_ID, 0
                    )
                    openDownloadedAttachment(context, downloadId)
                }
            }
        }
    }

    /**
     * Used to open the downloaded attachment.
     *
     * @param context    Content.
     * @param downloadId Id of the downloaded file to open.
     */
    @SuppressLint("Range")
    private fun openDownloadedAttachment(context: Context, downloadId: Long) {
        val downloadManager = context.getSystemService(DOWNLOAD_SERVICE) as DownloadManager
        val query = DownloadManager.Query()
        query.setFilterById(downloadId)
        val cursor: Cursor = downloadManager.query(query)
        if (cursor.moveToFirst()) {
            val downloadStatus = cursor.getInt(cursor.getColumnIndex(DownloadManager.COLUMN_STATUS))
            val downloadMediaProUri = cursor.getString(cursor.getColumnIndex(DownloadManager.COLUMN_MEDIAPROVIDER_URI))
            val downloadMimeType = cursor.getString(cursor.getColumnIndex(DownloadManager.COLUMN_MEDIA_TYPE))
            if (downloadStatus == DownloadManager.STATUS_SUCCESSFUL && downloadMediaProUri != null) {
                openDownloadedAttachment(context, Uri.parse(downloadMediaProUri), downloadMimeType)
            }
        }
        cursor.close()
    }

    /**
     * Used to open the downloaded attachment.
     *
     *
     * 1. Fire intent to open download file using external application.
     *
     * 2. Note:
     * 2.a. We can't share fileUri directly to other application (because we will get FileUriExposedException from Android7.0).
     * 2.b. Hence we can only share content uri with other application.
     * 2.c. We must have declared FileProvider in manifest.
     * 2.c. Refer - https://developer.android.com/reference/android/support/v4/content/FileProvider.html
     *
     * @param context            Context.
     * @param attachmentUri      Uri of the downloaded attachment to be opened.
     * @param attachmentMimeType MimeType of the downloaded attachment.
     */
    private fun openDownloadedAttachment(
        context: Context,
        attachmentUri: Uri,
        attachmentMimeType: String
    ) {
        val openAttachmentIntent = Intent(Intent.ACTION_VIEW)
        openAttachmentIntent.setDataAndType(attachmentUri, attachmentMimeType)
        openAttachmentIntent.flags = Intent.FLAG_GRANT_READ_URI_PERMISSION
        try {
            context.startActivity(openAttachmentIntent)
        } catch (e: ActivityNotFoundException) {
            e.printStackTrace()
        }
    }

    private val downloadListener = object : DownloadListener {
        override fun onDownloadStart(
            url: String?,
            userAgent: String?,
            contentDisposition: String?,
            mimetype: String?,
            contentLength: Long
        ) {
            val downloadRequest = DownloadManager.Request(Uri.parse(url))
            downloadRequest.setMimeType(mimetype)
            val cookies = CookieManager.getInstance().getCookie(url)
            downloadRequest.addRequestHeader("cookie", cookies)
            downloadRequest.addRequestHeader("User-Agent", userAgent)
            downloadRequest.setDescription("Download file...")
            val fileName = URLUtil.guessFileName(url, contentDisposition, mimetype)
            downloadRequest.setTitle(fileName)
            downloadRequest.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
            downloadRequest.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName)
            mDownloadManager = this@FullscreenActivity.getSystemService(DOWNLOAD_SERVICE) as DownloadManager?
            mDownloadRequest = downloadRequest
            Toast.makeText(this@FullscreenActivity, "Downloading file $fileName", Toast.LENGTH_LONG).show()

            if (ContextCompat.checkSelfPermission(this@FullscreenActivity,
                    Manifest.permission.WRITE_EXTERNAL_STORAGE) == PackageManager.PERMISSION_GRANTED
            ) {
                mDownloadManager?.enqueue(mDownloadRequest)
                Toast.makeText(this@FullscreenActivity, "Downloading file", Toast.LENGTH_LONG).show()
                mDownloadManager = null
                mDownloadRequest = null
            } else {
                ActivityCompat.requestPermissions(this@FullscreenActivity, arrayOf(Manifest.permission.WRITE_EXTERNAL_STORAGE), REQUEST_DOWNLOAD_FILE_PERMISSION)
            }
        }
    }

    private var savedFilePathCallback: ValueCallback<Array<Uri>>? = null
    private var savedFileChooserParams: WebChromeClient.FileChooserParams? = null

    @SuppressLint("SetJavaScriptEnabled")
    fun initWebView(webView: WebView) {
        if (this.initedWebView) {
            return
        }


        webView.webViewClient = object  : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView?,
                request: WebResourceRequest?
            ): Boolean {
                view?.loadUrl(request?.url.toString())
                return true
            }
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(
                webView: WebView?,
                filePathCallback: ValueCallback<Array<Uri>>?,
                fileChooserParams: FileChooserParams?
            ): Boolean {
                if (savedFilePathCallback != null) {
                    savedFilePathCallback!!.onReceiveValue(null)
                }

                savedFilePathCallback = filePathCallback

                runFilePickerDialog(fileChooserParams)

                return true
            }

            override fun onConsoleMessage(message: ConsoleMessage?): Boolean {
                Log.i("WebChrome", "${message?.message()} -- From line " +
                        "${message?.lineNumber()} of ${message?.sourceId()}")
                return super.onConsoleMessage(message)
            }

            override fun onGeolocationPermissionsShowPrompt(
                origin: String?,
                callback: GeolocationPermissions.Callback?
            ) {
                val perm = Manifest.permission.ACCESS_FINE_LOCATION
                val perm2 = Manifest.permission.ACCESS_COARSE_LOCATION
                if ((ContextCompat.checkSelfPermission(applicationContext, perm) == PackageManager.PERMISSION_GRANTED) &&
                    (ContextCompat.checkSelfPermission(applicationContext, perm2) == PackageManager.PERMISSION_GRANTED)) {
                    // we're on SDK < 23 OR user has already granted permission
                    Log.i("WebClient", "Permissions granted")
                    callback?.invoke(origin, true, false)
                } else {
                    // ask the user for permission
                    ActivityCompat.requestPermissions(this@FullscreenActivity, arrayOf(perm, perm2), REQUEST_LOCATION_PERMISSION)

                    // we will use these when user responds
                    mGeolocationOrigin = origin
                    mGeolocationCallback = callback
                }
            }
        }
        webView.settings.javaScriptEnabled = true
        webView.requestDisallowInterceptTouchEvent(true)
        webView.settings.setGeolocationEnabled(true)
        webView.settings.databaseEnabled = true
        webView.settings.domStorageEnabled = true
        webView.settings.allowFileAccess = true
        webView.settings.javaScriptCanOpenWindowsAutomatically = true
        webView.settings.builtInZoomControls = false
        // it's deprecated in API 18
        window.setFlags(WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED, WindowManager.LayoutParams.FLAG_HARDWARE_ACCELERATED)

        webView.setLayerType(View.LAYER_TYPE_HARDWARE, null)

        webView.setDownloadListener(downloadListener)

        this.initedWebView = true
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String?>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        when (requestCode) {
            REQUEST_LOCATION_PERMISSION -> {
                var allow = false
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    // user has allowed this permission
                    allow = true
                }
                if (mGeolocationCallback != null) {
                    // call back to web chrome client
                    mGeolocationCallback!!.invoke(mGeolocationOrigin, allow, false)
                }
            }
            REQUEST_DOWNLOAD_FILE_PERMISSION -> {
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    if (mDownloadRequest != null) {
                        mDownloadManager?.enqueue(mDownloadRequest)
                        mDownloadManager = null
                        mDownloadRequest = null
                        Toast.makeText(this, "Downloading file", Toast.LENGTH_LONG).show()
                    }
                }
            }
            REQUEST_READ_EXTERNAL_STORAGE_PERMISSION -> {
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    runFilePickerDialog(savedFileChooserParams)
                }
                else {
                    // fallback
                    savedFilePathCallback?.onReceiveValue(null)
                    savedFilePathCallback = null
                }
            }
        }
    }

    private fun runFilePickerDialog(fileChooserParams: WebChromeClient.FileChooserParams?) {
        val neededPermission = Manifest.permission.READ_EXTERNAL_STORAGE
        if (ContextCompat.checkSelfPermission(applicationContext, neededPermission) != PackageManager.PERMISSION_GRANTED) {
            savedFileChooserParams = fileChooserParams
            ActivityCompat.requestPermissions(this@FullscreenActivity, arrayOf(neededPermission), REQUEST_READ_EXTERNAL_STORAGE_PERMISSION)
            return
        }

        savedFileChooserParams = null

        val filePickerIntent = Intent(Intent.ACTION_GET_CONTENT)
        if (fileChooserParams == null) {
            filePickerIntent.type = "*/*"
            filePickerIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)
        }
        else {
            filePickerIntent.type = "*/*"

            val acceptType = fileChooserParams.acceptTypes
            if (acceptType.isNotEmpty() && acceptType[0].isNotEmpty()) {
                filePickerIntent.putExtra(Intent.EXTRA_MIME_TYPES, acceptType)
            }

            when (fileChooserParams.mode) {
                WebChromeClient.FileChooserParams.MODE_OPEN_MULTIPLE -> {
                    filePickerIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
                }
                WebChromeClient.FileChooserParams.MODE_OPEN -> {
                    filePickerIntent.putExtra(Intent.EXTRA_ALLOW_MULTIPLE, false)
                }
                else -> {
                    Log.i("Chooser", "Not support mode!")
                }
            }
        }
        filePickerIntent.addCategory(Intent.CATEGORY_OPENABLE)
        filePickerIntent.putExtra(Intent.EXTRA_LOCAL_ONLY, true)
        requestGetContent.launch(filePickerIntent)
    }

    private val requestGetContent = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) {
            result ->
        var resultUriArray: Array<Uri>? = null
        if (result.resultCode == Activity.RESULT_OK) {
            if (result.data != null) {
                val clipData = result.data!!.clipData
                if (clipData != null) {
                    resultUriArray = Array(clipData.itemCount) {
                            i -> clipData.getItemAt(i).uri
                    }
                }
                else {
                    val dataString = result.data!!.dataString
                    if (dataString != null) {
                        resultUriArray = arrayOf(Uri.parse(dataString))
                    }
                }
            }
        }

        savedFilePathCallback?.onReceiveValue(resultUriArray)
        savedFilePathCallback = null
    }

    override fun onPause() {
        CookieManager.getInstance().flush()

        super.onPause()
    }

    companion object {
        const val REQUESTED_MAIN_URL = "https://[URL-адрес вашего приложения]/"
        const val REQUEST_LOCATION_PERMISSION = 1001
        const val REQUEST_DOWNLOAD_FILE_PERMISSION = 1002
        const val REQUEST_READ_EXTERNAL_STORAGE_PERMISSION = 1003
    }

}