import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { CadastroPesquisaComponent } from './cadastro-pesquisa/cadastro-pesquisa.component';
import { SearchService } from './services/search.service';
import { AppRoutingModule } from './app-routing.module';

@NgModule({
  declarations: [
    
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule
  ],
  providers: [SearchService]
})
export class AppModule {}
